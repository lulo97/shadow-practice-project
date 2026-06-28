# Shawdow Project

Application overview: A place where users can practise english speaking by mimic speakers in Youtube video sources.

Users target: Vietnamese

Core features:
- Listen to segments of videos and record self speaking audios
- Verdict self speaking audios with high quality STT models
- View transcription in both english and vietnamese.

## Table of Contents
* [Database design](#1-database-design)
  * [Table session](#table-session)
  * [Table record](#table-record)
  * [Table users](#table-users)
  * [Table job](#table-job)
  * [Table job_step](#table-job_step)
  * [Table transcript_line](#table-transcript_line)
  * [Table user_setting](#table-user_setting)
  * [Tavle video](#tavle-video)
* [API Documentation](#api-documentation)
  * [Auth](#auth)
  * [Default](#default)
  * [Job](#job)
  * [ProfileData](#profiledata)
  * [Records](#records)
  * [SSE](#sse)
  * [Transcripts](#transcripts)
  * [UserSettings](#usersettings)
  * [Videos](#videos)
* [Frontend UI Layout Design](#frontend-ui-layout-design)

# Database design

Declare database object names in snake_case.

## Table session

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| user_id | int | No | Required, FK | Related user |
| token | string | No | Required | Session token |
| created_at | DateTime | No | - | Created time |
| expires_at | DateTime | No | - | Expire time |

## Table record

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| video_id | int | No | Required, FK | Related video |
| user_id | int | No | Required, FK | Creator user |
| transcript_line_id | int | No | Required | Transcript line ref |
| file_path | string | Yes | - | File path |
| blob_data | byte[] | Yes | - | Binary data |
| score | int | No | 0-100 | Quality score |
| stt_text | string | Yes | - | STT result |
| stt_provider_key | string | Yes | - | STT provider ID |
| created_at | DateTime | No | Default UTC Now | Created time |

## Table users

| Column Name | Data Type | Nullable | Constraints | Note |
|---|---|---|---|---|
| id | integer | No | Primary Key, Identity | Auto-generated ID |
| username | varchar/text | No | Required | User login name |
| password_hashed | varchar/text | No | Required | Stored hashed password |
| created_at | timestamp | Yes | None | Record creation time |

## Table job

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| user_id | int | No | FK | Related user |
| video_id | int | No | FK | Related video |
| status | JobStatus | No | Required | QUEUED, RUNNING, DONE, FAILED |
| type | JobType | No | Required | VIDEO_INGEST, TRANSLATION |
| created_at | DateTime | No | Default UTC Now | Created time |

## Table job_step

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| job_id | int | No | FK | Related job |
| step_name | string | No | Required | Step description |
| status | JobStepStatus | No | Required | Step status |
| note | string | Yes | - | User detail |
| error_msg | string | Yes | - | Error detail |
| started_at | DateTime | Yes | - | Start time |
| ended_at | DateTime | Yes | - | End time |

## Table transcript_line 

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| video_id | int | No | Required, FK | Related video |
| line_index | int | No | Required | Line order |
| text | string | No | Required | Original text |
| vi_text | string | Yes | - | Vietnamese text |
| start | decimal | No | Required | Start time |
| end | decimal | No | Required | End time |
| skip | int | No | Default 0 | Skip flag |
| created_at | DateTime | No | Default UTC Now | Created time |

## Table user_setting

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| user_id | int | No | Required, FK | Related user |
| stt_provider_key | string | No | Required | STT provider ID |
| loop | int | No | Default 0 | 0 off, 1 on |
| video_width_size | int | No | - | Video width |

## Table video

| Column | Type | Null | Constraints | Note |
|---|---|---|---|---|
| id | int | No | PK, Identity | Auto ID |
| user_id | int | No | Required, FK | Owner user |
| youtube_id | string | No | Required | YouTube ID |
| created_at | DateTime | No | Default UTC Now | Created time |
| filename | string | Yes | - | Video file |
| blob_data | byte[] | Yes | - | Video data |
| audio_filename | string | Yes | - | Audio file |
| audio_blob_data | byte[] | Yes | - | Audio data |
| title | string | No | Required | Video title |
| description | string | Yes | - | Video description |
| thumbnail | byte[] | Yes | - | Thumbnail data |
| thumbnail_file_name | string | Yes | - | Thumbnail file |

# API Documentation

---

## Auth

### GET /api/auth/me
Retrieves the currently authenticated user's profile from the session cookie.

**Output:**
```json
{ "id": int, "username": string, "createdAt": datetime }
```

**Business Rules:**
- Reads the `session_token` cookie from the request.
- Looks up the session in the database. If not found, returns `401 Unauthorized`.
- If the session is expired, it is deleted from the database and `401 Unauthorized` is returned.
- If the user tied to the session no longer exists, returns `404 Not Found`.
- On success, returns the user's ID, username, and creation timestamp.

---

### POST /api/auth/signup
Registers a new user account.

**Input Body:**
```json
{ "username": string (required), "password": string (required) }
```

**Business Rules:**
- Both `username` and `password` must be non-empty strings; otherwise returns `400 Bad Request`.
- If a user with the same username already exists, returns `400 Bad Request` with message `"Username is already taken."`.
- Password is stored as-is (hashing is a placeholder — must be properly implemented before production).
- On success, returns `200 OK` with `{ "message": "Registration successful" }`. No session cookie is set; the user must log in separately.

---

### POST /api/auth/login
Authenticates a user and issues a session cookie.

**Input Body:**
```json
{ "username": string (required), "password": string (required) }
```

**Output:**
```json
{ "message": "Login successful", "user": { "id": int, "username": string } }
```

**Business Rules:**
- Looks up the user by `username`. If not found, or if the password does not match, returns `401 Unauthorized` with `"Invalid Username or password."` (no distinction between the two failure reasons, to avoid enumeration attacks).
- On success, creates a new `Session` record with a cryptographically strong random token (two concatenated GUIDs, 64 hex characters), expiring 7 days from now.
- Sets an `HttpOnly`, `Secure`, `SameSite=None` cookie named `session_token` with the token value and the session's expiry time.

---

### POST /api/auth/logout
Invalidates the current session and clears the session cookie.

**Output:**
```json
{ "message": "Logged out successfully" }
```

**Business Rules:**
- Reads the `session_token` cookie. If present, finds the matching session in the database and deletes it.
- Deletes the `session_token` cookie from the response regardless of whether a session was found.
- Always returns `200 OK`, even if the user was not logged in.

---

## Default

### GET /health
Returns a simple liveness check.

**Output:**
```json
{ "message": "ok" }
```

**Business Rules:**
- No authentication required.
- Used by external services (e.g. STT/LLM servers) to verify the API is reachable.

---

## Job

### POST /api/job/video
Submits a YouTube video for ingestion (downloading, transcription, and transcript storage).

**Input Body:**
```json
{ "youtubeLink": string (required) }
```

**Output:**
```json
{ "jobId": int }
```

**Business Rules:**
- Requires an authenticated session cookie; returns `404` if the user is not found.
- `youtubeLink` must be a valid absolute URL with host `youtube.com` or `www.youtube.com`, path exactly `/watch`, and a `v` query parameter containing the video ID. Returns `400 Bad Request` if invalid.
- A new `Video` record is created immediately with the authenticated user's ID and the extracted YouTube video ID.
- A new `Job` record is created with `Type = VideoIngest` and `Status = Queued`, linked to the new video.
- The job is processed asynchronously by a background service. The returned `jobId` can be polled via `GET /api/job/video-detail/{job_id}` to track progress.
- The background service processes one job at a time in FIFO order, polling every 5 seconds.

**Job Processing Steps (in order):**
1. Fetch video title via yt-dlp.
2. Fetch and store video thumbnail.
3. Fetch video description via yt-dlp.
4. Download video file (up to 360p MP4) and store it.
5. Attempt to fetch built-in English subtitles (VTT format).
6. If no built-in subtitles: download audio as MP3, then transcribe using the configured ASR service.
7. Parse transcript lines and store them in the database, each with a start time, end time, and text.
8. Broadcast a `RESET_HOMEPAGE` SSE event to all connected frontend clients.

Each step is tracked as a `JobStep` record with status, timestamps, and optional notes or error messages.

---

### GET /api/job/video-detail/{job_id}
Returns the current status of a job and all its step records.

**Input Param:**
- `job_id`: int — the job ID returned from `POST /api/job/video`.

**Output:**
```json
{
  "job": {
    "id": int,
    "userId": int,
    "videoId": int,
    "status": string,   // "Queued" | "Running" | "Done" | "Failed"
    "type": string,     // "VideoIngest" | "Translation"
    "createdAt": datetime
  },
  "jobSteps": [
    {
      "id": int,
      "jobId": int,
      "stepName": string,
      "status": string,   // "PENDING" | "RUNNING" | "DONE" | "FAILED" | "SKIPPED"
      "note": string | null,
      "errorMsg": string | null,
      "startedAt": datetime | null,
      "endedAt": datetime | null
    }
  ]
}
```

**Business Rules:**
- No authentication required.
- Returns `404 Not Found` if no job with the given ID exists.
- Steps are returned in insertion order (by ascending ID), reflecting the chronological pipeline sequence.
- If a step threw an unhandled exception (i.e. `Complete()` was never called), its status is automatically set to `FAILED` when the step scope is disposed.

---

## ProfileData

### GET /api/profiledata
Returns aggregated activity statistics for the authenticated user.

**Output:**
```json
{
  "userId": int,
  "stats": {
    "totalVideosLearned": int,
    "totalRecordingsMade": int,
    "averageScore": int,
    "totalJobsRun": int,
    "completedJobs": int,
    "failedJobs": int
  },
  "videos": [
    {
      "videoId": int,
      "youtubeId": string,
      "title": string,
      "totalLines": int,
      "practicedLines": int,
      "bestScore": int,
      "averageScore": int,
      "lastPracticedAt": datetime | null
    }
  ],
  "recentRecords": [
    {
      "recordId": int,
      "videoTitle": string,
      "transcriptText": string,
      "viText": string | null,
      "score": int,
      "sttText": string | null,
      "createdAt": datetime
    }
  ]
}
```

**Business Rules:**
- Requires an authenticated session cookie; returns `400 Bad Request` if authentication fails.
- `stats.totalVideosLearned`: the number of distinct videos the user has recorded at least one line for.
- `stats.averageScore`: the mean score across all the user's records (0 if no records exist).
- `videos`: one entry per video the user has practiced. `practicedLines` counts the number of distinct transcript lines that have at least one record. `totalLines` counts all transcript lines for that video.
- `recentRecords`: the 20 most recent records, ordered by `createdAt` descending, joined with the corresponding transcript line text and video title.

---

## Records

### POST /api/records
Submits an audio recording for a specific transcript line, runs speech-to-text, scores the result, and stores the audio.

**Input Form (multipart/form-data):**
| Field | Type | Required | Description |
|---|---|---|---|
| `file` | binary | Yes | The audio recording (WebM/Opus or WAV). |
| `videoId` | int | Yes | The ID of the video this recording belongs to. |
| `transcriptLineId` | int | Yes | The ID of the transcript line being practiced. |

**Output:**
```json
{ "message": "New record id = {id}" }
```

**Business Rules:**
- Requires an authenticated session cookie to resolve the user's ID and STT provider setting.
- Returns `404 Not Found` if `transcriptLineId` does not exist.
- Returns `400 Bad Request` if the transcript line is marked as skipped (`skip = 1`); skipped lines cannot be recorded.
- If the uploaded audio file is empty or smaller than 1 KB (considered an invalid/silent recording), the system substitutes a predefined dummy WAV file for STT processing. This allows the pipeline to continue and produce a low score rather than failing.
- The audio is converted to 16kHz mono WAV via FFmpeg before being sent to the STT provider.
- STT provider is determined by the user's `UserSetting.SttProviderKey` (e.g. `WHISPER_CPP`, `PARAKEET`). Defaults to `WHISPER_CPP` if no setting exists.
- Score (0–100) is computed using a Levenshtein-distance-based similarity between the original transcript line text and the STT-produced text, both lowercased and trimmed.
- After the `Record` row is saved, the raw audio bytes are written to storage (either database blob or local file) via the configured `IRecordFileWriter`.

---

### GET /api/records/metadata/{id}
Returns metadata for a single record, without the audio binary.

**Input Param:**
- `id`: int — the record ID.

**Output:**
```json
{
  "id": int,
  "filePath": string | null,
  "transcriptLineId": int,
  "sttProviderKey": string | null,
  "sttText": string | null,
  "createdAt": datetime,
  "score": int
}
```

**Business Rules:**
- Returns `404 Not Found` if the record does not exist.
- No authentication required.

---

### GET /api/records/file/{id}
Streams the raw audio file for a record.

**Input Param:**
- `id`: int — the record ID.

**Output:** Binary audio file (`audio/wav`), with filename `{id}.wav`.

**Business Rules:**
- Returns `404 Not Found` if the record does not exist.
- Returns `204 No Content` if the audio data is missing (neither `BlobData` nor `FilePath` resolves to data).
- Audio is read via the configured `IRecordFileReader` (either from database blob or local file path).
- No authentication required.

---

### GET /api/records/transcript-line/{transcript_line_id}
Returns all records for a given transcript line.

**Input Param:**
- `transcript_line_id`: int — the transcript line ID.

**Output:**
```json
[
  {
    "id": int,
    "filePath": string | null,
    "transcriptLineId": int,
    "sttProviderKey": string | null,
    "sttText": string | null,
    "createdAt": datetime,
    "score": int
  }
]
```

**Business Rules:**
- Returns all records associated with the given transcript line, regardless of which user created them.
- Returns an empty array if none exist.
- No authentication required.

---

## SSE

### GET /api/sse/stream
Opens a persistent Server-Sent Events stream for real-time push notifications from the server.

**Output:** `text/event-stream` — a continuous stream of SSE events.

**Event Examples:**
```
data: {"type":"connected"}

data: {"message":"RESET_HOMEPAGE"}

data: {"message":"UPDATE_TRANSLATION","data":"12/80"}

data: {"message":"UPDATE_TRANSLATION_LINE_BY_LINE","data":"5/80"}
```

**Business Rules:**
- No authentication required.
- On connection, immediately sends a `{"type":"connected"}` ping event.
- The connection is held open indefinitely until the client disconnects (via `CancellationToken`).
- Each connected client is tracked by a server-generated GUID. Clients are automatically unregistered on disconnect.
- Events are broadcast to all currently connected clients simultaneously.
- `RESET_HOMEPAGE` is emitted when a `VideoIngest` job completes, signaling the frontend to refresh the video list.
- `UPDATE_TRANSLATION` is emitted during bulk LLM translation with a progress fraction (`current/total`).
- `UPDATE_TRANSLATION_LINE_BY_LINE` is emitted during the fallback line-by-line LLM translation mode.

---

## Transcripts

### GET /api/transcripts/{video_id}
Returns all transcript lines for a video, each including any records made on that line.

**Input Param:**
- `video_id`: int — the video ID.

**Output:**
```json
[
  {
    "id": int,
    "videoId": int,
    "text": string,
    "viText": string | null,
    "start": decimal,
    "end": decimal,
    "skip": int,
    "records": [
      {
        "id": int,
        "sttText": string | null,
        "score": int,
        "sttProviderKey": string | null,
        "createdAt": datetime
      }
    ]
  }
]
```

**Business Rules:**
- No authentication required.
- `start` and `end` are timestamps in seconds (e.g. `1.5`, `6.91`) derived from the original VTT subtitle timecodes.
- `skip` is `0` (active) or `1` (skipped). Skipped lines cannot be recorded but count toward completion percentage.
- `viText` is the Vietnamese translation of the line; `null` if not yet translated.
- `records` contains all recordings by all users for each line. Audio content is not included — use `GET /api/records/file/{id}` for the actual audio.
- Lines are returned in the order they were stored (ascending `id`), which corresponds to `lineIndex` order.

---

### POST /api/transcripts/skip/{transcript_line_id}
Toggles the skip flag on a transcript line.

**Input Param:**
- `transcript_line_id`: int — the transcript line ID.

**Output:**
```json
{
  "id": int,
  "videoId": int,
  "lineIndex": int,
  "text": string,
  "viText": string | null,
  "start": decimal,
  "end": decimal,
  "skip": int,
  "createdAt": datetime
}
```

**Business Rules:**
- Returns `404 Not Found` if the transcript line does not exist.
- Returns `400 Bad Request` if the line already has at least one associated `Record`; recorded lines cannot be skipped.
- Toggles `skip`: if currently `0`, sets to `1`; if currently `1`, sets back to `0`.
- No authentication required.

---

### POST /api/transcripts/translate/{video_id}
Manually saves Vietnamese translations for all transcript lines of a video.

**Input Param:**
- `video_id`: int — the video ID.

**Input Body:**
```json
{ "viText": string }
```

The `viText` string must be formatted as numbered lines:
```
1: First line in Vietnamese
2: Second line in Vietnamese
3: Third line in Vietnamese
```

**Output:**
```json
{ "message": "Saved {n} vi text lines" }
```

**Business Rules:**
- Each line must begin with its 1-based line number followed by a colon (`:`), e.g. `1: câu đầu tiên`. Missing or malformed prefixes return `400 Bad Request`.
- Each numbered line must have non-empty content after the colon prefix.
- The count of submitted lines must exactly match the number of transcript lines stored for the video; a mismatch returns `400 Bad Request`.
- Lines are matched positionally (1st submitted line → lowest `lineIndex` transcript line, etc.).
- Overwrites any existing `viText` values.
- No authentication required.

---

### GET /api/transcripts/llm/{video_id}
Automatically translates all transcript lines for a video using the local LLM server, then saves the results.

**Input Param:**
- `video_id`: int — the video ID.

**Output:**
```json
{ "message": "Auto saved {n} vi text lines" }
```

**Business Rules:**
- Builds a numbered prompt from all transcript lines and sends it to the local LLM (llama-server on port 8081).
- The LLM is instructed to return exactly one output line per input line, in the format `index: vietnamese text`, preserving fragments and not merging lines.
- If the LLM response line count does not match the expected count, the system automatically falls back to a slower line-by-line translation mode, processing each line individually in sequence.
- SSE events (`UPDATE_TRANSLATION` or `UPDATE_TRANSLATION_LINE_BY_LINE`) are broadcast during processing so the frontend can display progress.
- After translation, the same validation and save logic as `POST /api/transcripts/translate/{video_id}` is applied. Returns `400 Bad Request` if the LLM output fails validation.
- No authentication required. Requires the llama-server to be running.

---

## UserSettings

### GET /api/usersettings
Returns the authenticated user's settings.

**Output:**
```json
{
  "id": int,
  "userId": int,
  "sttProviderKey": string,
  "loop": int,
  "videoWidthSize": int
}
```

**Business Rules:**
- Requires an authenticated session cookie.
- If no settings row exists for the user, returns a default object (not persisted): `sttProviderKey = "WHISPER_CPP"`, `loop = 0`, `videoWidthSize = 50`.

---

### POST /api/usersettings
Creates or fully replaces the authenticated user's settings.

**Input Body:**
```json
{
  "sttProviderKey": string,
  "loop": int,
  "videoWidthSize": int
}
```

**Output:**
```json
{
  "id": int,
  "userId": int,
  "sttProviderKey": string,
  "loop": int,
  "videoWidthSize": int
}
```

**Business Rules:**
- Requires an authenticated session cookie.
- `sttProviderKey` must be one of: `"WHISPER_CPP"`, `"PARAKEET"`.
- `loop` must be `0` (off) or `1` (on).
- `videoWidthSize` must be between `10` and `90` (inclusive), representing the percentage width of the video player.
- If a settings row already exists for the user, it is updated in place. Otherwise, a new row is created.
- Returns `400 Bad Request` with a comma-separated list of validation error messages if any value is invalid.

---

### POST /api/usersettings/update-property
Patches a single property on the authenticated user's settings.

**Input Body:**
```json
{ "key": string, "value": any }
```

**Output:**
```json
{
  "id": int,
  "userId": int,
  "sttProviderKey": string,
  "loop": int,
  "videoWidthSize": int
}
```

**Business Rules:**
- Requires an authenticated session cookie.
- `key` is matched case-insensitively against public instance properties of `UserSetting` (e.g. `"SttProviderKey"`, `"loop"`, `"VideoWidthSize"`).
- Returns `400 Bad Request` if `key` does not correspond to any property on `UserSetting`.
- `value` is automatically cast to the target property's type. Supports strings, numbers, and booleans. Returns `400 Bad Request` if the cast fails.
- After patching, the full settings object is validated using the same rules as `POST /api/usersettings`. Returns `400 Bad Request` if validation fails.
- If no settings row exists yet for the user, a new one is created with defaults before applying the patch.

---

### GET /api/usersettings/datasource
Returns the allowed values for each setting field, for use in frontend dropdowns.

**Output:**
```json
{
  "sttProviders": ["WHISPER_CPP", "PARAKEET"],
  "loopOptions": [0, 1]
}
```

**Business Rules:**
- No authentication required.
- Values here are the canonical allowed values for `sttProviderKey` and `loop` validation.

---

## Videos

### GET /api/videos
Returns a filtered list of videos with practice progress statistics for the authenticated user.

**Input Query:**
| Param | Type | Required | Description |
|---|---|---|---|
| `title` | string | No | Case-insensitive substring match on video title. |
| `fromDate` | datetime | No | Only include videos created on or after this date. |
| `toDate` | datetime | No | Only include videos created on or before this date. |
| `videoType` | string | No | `"SYSTEM_VIDEOS"` returns videos owned by the admin (shared library); any other value (or omitted) returns the user's own videos. |

**Output:**
```json
[
  {
    "id": int,
    "title": string | null,
    "youtubeId": string | null,
    "userId": int | null,
    "createdAt": datetime | null,
    "description": string | null,
    "jobId": int | null,
    "status": string | null,
    "processPercent": int | null,
    "lastPracticed": datetime | null
  }
]
```

**Business Rules:**
- Requires an authenticated session cookie.
- Results are ordered by `createdAt` descending (newest first).
- `status` reflects the user's practice completion for that video:
  - `"NOT_STARTED"`: no lines have been recorded or skipped.
  - `"UNFINISHED"`: at least one line has been recorded or skipped, but not all.
  - `"FINISHED"`: every transcript line has either been recorded or skipped.
- `processPercent`: integer 0–100 representing the fraction of lines that are either recorded or skipped.
- `jobId`: the most recent job associated with the video (from a LEFT JOIN; may be `null` if no job exists).
- `lastPracticed`: the most recent `createdAt` timestamp across all records for that video, or `null` if never practiced.

---

### GET /api/videos/thumbnail/{video_id}
Serves the thumbnail image for a video.

**Input Param:**
- `video_id`: int — the video ID.

**Output:** Binary image (`image/jpeg`), or `{ "message": "Thumbnail not available." }` if no thumbnail is stored.

**Business Rules:**
- Returns `404 Not Found` if the video does not exist.
- Thumbnail is read via the configured `IVideoFileReader` (from database blob or local file).
- No authentication required.

---

### GET /api/videos/video_data/{video_id}
Streams the video file for a video, with support for HTTP range requests (partial content for seeking).

**Input Param:**
- `video_id`: int — the video ID.

**Output:** Binary video (`video/mp4`) with range processing enabled, or `{ "message": "Video data not available." }` if no video is stored.

**Business Rules:**
- Returns `404 Not Found` if the video does not exist.
- Range requests (`Range` header) are supported, enabling video scrubbing in the browser without downloading the full file.
- Video is read via the configured `IVideoFileReader`.
- No authentication required.

---

### GET /api/videos/metadata/{video_id}
Returns descriptive metadata for a video without the binary data.

**Input Param:**
- `video_id`: int — the video ID.

**Output:**
```json
{
  "id": int,
  "title": string,
  "createdAt": datetime,
  "description": string | null,
  "youtubeId": string
}
```

**Business Rules:**
- Returns `404 Not Found` if the video does not exist.
- No authentication required.

# Frontend UI Layout Design

![Alt text](documents\ui-ver4.drawio.svg)
