No new tables needed, just new step values
Your Jobs and JobSteps tables already handle it. Just add a type column to Jobs so you can distinguish ingestion jobs from translation jobs.
sqlALTER TABLE Jobs ADD COLUMN type text; 
-- type: VIDEO_INGEST or TRANSLATION

## Revised steps for TRANSLATION job

```
FETCH_LINES       -- pull all en lines from DB
LLM_TRANSLATE     -- one single request with full context, get all vi lines back
VALIDATE_COUNTS   -- count check before writing anything
SAVE_VI_TEXT      -- write line by line to DB as we go
```

SAVE_VI_TEXT stays but is now the incremental write step, not LLM_TRANSLATE.

---

## Alice triggers translation for Video 1 (3 lines)

```sql
INSERT INTO Jobs (id, user_id, video_id, type, status, created_at)
VALUES (3, 1, 1, 'TRANSLATION', 'QUEUED', '2024-01-10 10:00:00');

INSERT INTO JobSteps (id, job_id, step, status) VALUES
(9,  3, 'FETCH_LINES',      'PENDING'),
(10, 3, 'LLM_TRANSLATE',    'PENDING'),
(11, 3, 'VALIDATE_COUNTS',  'PENDING'),
(12, 3, 'SAVE_VI_TEXT',     'PENDING');
```

```sql
UPDATE Jobs SET status = 'RUNNING' WHERE id = 3;
```

---

## Step: FETCH_LINES

Worker reads all transcript lines for video 1 ordered by id.

```sql
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 10:00:01' WHERE id = 9;

-- worker runs:
-- SELECT id, text FROM TranscriptLine WHERE video_id = 1 ORDER BY id ASC
-- result held in worker memory:
-- [ {id:1, text:'A cat has 4 legs'}, {id:2, text:'A cat eats mouse'}, {id:3, text:'Cats are relative to tigers'} ]

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 10:00:01' WHERE id = 9;
```

---

## Step: LLM_TRANSLATE

Worker builds one prompt with all lines numbered, sends single request to local LLM. Worker waits. This is the slow step.

The prompt sent to LLM looks like this:

```
Translate the following English subtitle lines to Vietnamese.
Keep the same numbered format exactly. Do not merge or split lines.
Output only the translations, one per line, with the same line number prefix.

1. A cat has 4 legs
2. A cat eats mouse
3. Cats are relative to tigers
```

```sql
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 10:00:02' WHERE id = 10;

-- LLM processes full context, returns after ~2 minutes:
-- 1. Một con mèo có 4 chân
-- 2. Một con mèo ăn chuột
-- 3. Mèo có họ hàng với hổ
--
-- worker parses this into:
-- [ {line_number:1, vi_text:'Một con mèo có 4 chân'},
--   {line_number:2, vi_text:'Một con mèo ăn chuột'},
--   {line_number:3, vi_text:'Mèo có họ hàng với hổ'} ]
-- held in worker memory

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 10:02:10' WHERE id = 10;
```

---

## Step: VALIDATE_COUNTS

Worker checks parsed LLM output against what was fetched. Both are in memory at this point.

```sql
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 10:02:10' WHERE id = 11;

-- fetched line count  = 3
-- LLM output count   = 3
-- 3 == 3, pass
--
-- also check no line_number is missing: got 1,2,3 expected 1,2,3, pass
-- also check no vi_text is empty string or null in parsed result, pass

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 10:02:10' WHERE id = 11;
```

Failure case — LLM returned only 2 lines (hallucinated a merge):

```sql
-- don't run, showing pattern only
UPDATE JobSteps SET status = 'FAILED',
  error_msg = 'LLM returned 2 lines, expected 3. Possible line merge detected.',
  ended_at = '2024-01-10 10:02:10' WHERE id = 11;
UPDATE Jobs SET status = 'FAILED' WHERE id = 3;
-- nothing has been written to TranscriptLine yet, DB is clean
```

Alice sees the failure in the modal. She can retry — the retry reruns from FETCH_LINES since nothing was written.

---

## Step: SAVE_VI_TEXT

Validation passed. Worker now iterates through the parsed result and writes one row at a time. If the worker crashes mid-write here, on retry it skips rows where `vi_text` is already not null.

```sql
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 10:02:11' WHERE id = 12;

-- writing line 1
UPDATE TranscriptLine SET vi_text = 'Một con mèo có 4 chân' WHERE id = 1 AND vi_text IS NULL;
-- writing line 2
UPDATE TranscriptLine SET vi_text = 'Một con mèo ăn chuột' WHERE id = 2 AND vi_text IS NULL;
-- writing line 3
UPDATE TranscriptLine SET vi_text = 'Mèo có họ hàng với hổ' WHERE id = 3 AND vi_text IS NULL;

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 10:02:11' WHERE id = 12;
```

The `AND vi_text IS NULL` guard is the resume logic. If worker crashes after writing line 1 and 2, then restarts and replays SAVE_VI_TEXT, lines 1 and 2 are skipped safely, only line 3 gets written.

---

## Job complete

```sql
UPDATE Jobs SET status = 'DONE' WHERE id = 3;
```

---

## What Alice sees polling GET /jobs/3/steps

Right after clicking Auto translate:
```
FETCH_LINES      PENDING
LLM_TRANSLATE    PENDING
VALIDATE_COUNTS  PENDING
SAVE_VI_TEXT     PENDING
```

LLM is thinking (the long wait):
```
FETCH_LINES      DONE
LLM_TRANSLATE    RUNNING   ← could be 1-5 min depending on video length
VALIDATE_COUNTS  PENDING
SAVE_VI_TEXT     PENDING
```

Final state:
```
FETCH_LINES      DONE
LLM_TRANSLATE    DONE
VALIDATE_COUNTS  DONE
SAVE_VI_TEXT     DONE
```

---

## Crash recovery summary

| Crash during | DB state | Retry behavior |
|---|---|---|
| LLM_TRANSLATE | vi_text all null | Re-fetch lines, re-call LLM from scratch |
| VALIDATE_COUNTS | vi_text all null | Re-fetch lines, re-call LLM from scratch |
| SAVE_VI_TEXT line 2 of 3 | line 1 written, 2 and 3 null | Skip line 1 via IS NULL guard, write 2 and 3 only |