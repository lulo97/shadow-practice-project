## Job Tracking Tables (add to your schema)

```sql
Jobs (
  id int, -- auto increment
  user_id int,
  video_id int,
  status text, -- QUEUED, RUNNING, DONE, FAILED
  created_at datetime
)

JobSteps (
  id int,
  job_id int,
  step text, -- DOWNLOAD, EXTRACT_AUDIO, ASR, STORE_LINES
  status text, -- PENDING, RUNNING, DONE, FAILED, SKIPPED
  error_msg text,
  started_at datetime,
  ended_at datetime
)
```

---

## Video 1: https://youtube.com/watch?v=123 (has English subtitles)

### Step 1 — Alice submits the link

Alice POSTs the link. Server immediately returns 202.

```
-- Create video row, no title yet
INSERT INTO Videos (id, user_id, youtube_link, created_at, title, description, filename)
VALUES (1, 1, 'https://youtube.com/watch?v=123', '2024-01-10 09:00:00', null, null, null);

-- Create job
INSERT INTO Jobs (id, user_id, video_id, status, created_at)
VALUES (1, 1, 1, 'QUEUED', '2024-01-10 09:00:00');

-- Create all steps upfront as PENDING
INSERT INTO JobSteps (id, job_id, step, status) VALUES
(1, 1, 'DOWNLOAD',      'PENDING'),
(2, 1, 'EXTRACT_AUDIO', 'PENDING'),
(3, 1, 'ASR',           'PENDING'),
(4, 1, 'STORE_LINES',   'PENDING');
```

---

### Step 2 — Worker picks up the job

```
UPDATE Jobs SET status = 'RUNNING' WHERE id = 1;
```

---

### Step 3 — DOWNLOAD step

Worker calls yt-dlp, discovers English subtitles exist, downloads video + subtitle file.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:00:01' WHERE id = 1;

-- yt-dlp finishes, file saved as video_1.mp4
UPDATE Videos SET filename = 'video_1.mp4', title = 'TedTalk video about cats!',
  description = 'A talk about cats.' WHERE id = 1;

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:00:20' WHERE id = 1;
```

---

### Step 4 — EXTRACT_AUDIO step

English subs exist, no audio extraction needed for ASR. Worker marks this SKIPPED.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:00:20' WHERE id = 2;
UPDATE JobSteps SET status = 'SKIPPED', ended_at = '2024-01-10 09:00:20' WHERE id = 2;
```

---

### Step 5 — ASR step

Subtitles found, skip ASR entirely.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:00:20' WHERE id = 3;
UPDATE JobSteps SET status = 'SKIPPED', ended_at = '2024-01-10 09:00:20' WHERE id = 3;
```

---

### Step 6 — STORE_LINES step

Worker parses the .vtt/.srt subtitle file and inserts each line.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:00:20' WHERE id = 4;

INSERT INTO TranscriptLine (id, video_id, text, vi_text, start, end, skip, created_at) VALUES
(1, 1, 'A cat has 4 legs',            null, 0.00,  3.50,  0, '2024-01-10 09:00:21'),
(2, 1, 'A cat eats mouse',            null, 3.50,  7.00,  0, '2024-01-10 09:00:21'),
(3, 1, 'Cats are relative to tigers', null, 7.00,  12.00, 0, '2024-01-10 09:00:21');
-- ... remaining lines

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:00:22' WHERE id = 4;
```

---

### Step 7 — Job complete

```
UPDATE Jobs SET status = 'DONE' WHERE id = 1;
```

---

### What Alice's UI sees when polling GET /jobs/1/steps

Immediately after submit:
```
DOWNLOAD      PENDING
EXTRACT_AUDIO PENDING
ASR           PENDING
STORE_LINES   PENDING
```

While downloading:
```
DOWNLOAD      RUNNING
EXTRACT_AUDIO PENDING
ASR           PENDING
STORE_LINES   PENDING
```

Final state:
```
DOWNLOAD      DONE
EXTRACT_AUDIO SKIPPED
ASR           SKIPPED
STORE_LINES   DONE
```

---
---

## Video 2: https://youtube.com/watch?v=456 (no English subtitles, needs ASR)

### Step 1 — Alice submits the second link

```
INSERT INTO Videos (id, user_id, youtube_link, created_at, title, description, filename)
VALUES (2, 1, 'https://youtube.com/watch?v=456', '2024-01-10 09:05:00', null, null, null);

INSERT INTO Jobs (id, user_id, video_id, status, created_at)
VALUES (2, 1, 2, 'QUEUED', '2024-01-10 09:05:00');

INSERT INTO JobSteps (id, job_id, step, status) VALUES
(5, 2, 'DOWNLOAD',      'PENDING'),
(6, 2, 'EXTRACT_AUDIO', 'PENDING'),
(7, 2, 'ASR',           'PENDING'),
(8, 2, 'STORE_LINES',   'PENDING');
```

---

### Step 2 — Worker picks up

```
UPDATE Jobs SET status = 'RUNNING' WHERE id = 2;
```

---

### Step 3 — DOWNLOAD step

Worker calls yt-dlp, discovers no English subtitles.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:05:01' WHERE id = 5;

-- yt-dlp saves video only, no subtitle file
UPDATE Videos SET filename = 'video_2.mp4', title = 'Another cat video',
  description = 'More cats.' WHERE id = 2;

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:05:25' WHERE id = 5;
```

---

### Step 4 — EXTRACT_AUDIO step

No subtitles found, so worker must extract audio for Whisper.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:05:25' WHERE id = 6;

-- ffmpeg extracts audio_2.wav from video_2.mp4
-- no DB write needed here, it's a temp file on disk

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:05:40' WHERE id = 6;
```

---

### Step 5 — ASR step

Whisper runs on audio_2.wav. This is the slow step, could take several minutes.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:05:40' WHERE id = 7;

-- Whisper finishes, produces timestamped segments in memory
-- nothing written to DB yet, transcript held in worker memory

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:12:10' WHERE id = 7;
```

---

### Step 6 — STORE_LINES step

Worker takes Whisper output and inserts lines.

```
UPDATE JobSteps SET status = 'RUNNING', started_at = '2024-01-10 09:12:10' WHERE id = 8;

INSERT INTO TranscriptLine (id, video_id, text, vi_text, start, end, skip, created_at) VALUES
(4, 2, 'Welcome to this video',   null, 0.00,  4.20,  0, '2024-01-10 09:12:11'),
(5, 2, 'Today we talk about cats',null, 4.20,  8.80,  0, '2024-01-10 09:12:11'),
(6, 2, 'Cats are fascinating',    null, 8.80,  13.50, 0, '2024-01-10 09:12:11');
-- ... remaining lines

UPDATE JobSteps SET status = 'DONE', ended_at = '2024-01-10 09:12:12' WHERE id = 8;
```

---

### Step 7 — Job complete

```
UPDATE Jobs SET status = 'DONE' WHERE id = 2;
```

---

### What Alice's UI sees when polling GET /jobs/2/steps

While Whisper is running (the long wait):
```
DOWNLOAD      DONE
EXTRACT_AUDIO DONE
ASR           RUNNING   ← user sees this spinning for ~6 minutes
STORE_LINES   PENDING
```

Final state:
```
DOWNLOAD      DONE
EXTRACT_AUDIO DONE
ASR           DONE
STORE_LINES   DONE
```

---

## Key difference between the two videos

| | Video 1 (has subs) | Video 2 (no subs) |
|---|---|---|
| EXTRACT_AUDIO | SKIPPED | DONE |
| ASR | SKIPPED | DONE (~6 min) |
| Total time | ~22 seconds | ~7 minutes |
| Source of transcript | .vtt/.srt file from yt-dlp | Whisper timestamped segments |
| `vi_text` after job | null (needs translation step) | null (needs translation step) |

Both videos end with `vi_text = null` on every `TranscriptLine`. Alice must trigger the Translation modal separately to populate those.