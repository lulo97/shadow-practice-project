Users (
    id int, //auto increment
    username string,
    password_hashed string,
    created_at datetime
)

UserSettings (
    id int, //keep all table have id column for consistancy
    user_id int, 
    stt_provider_key string, //id of stt provider, ref to SystemEnums.key, example WHISPER_CPP = key
    volume int, //0 to 100
    record_screen_ui_style string, //ONE_SENTENCE or MULTIPLE_SENTENCE
    loop int, //0 = off, 1 = on
    video_width_size int, //10% - 90%
)

//STT provider id stored here
//record_screen_ui_style stored here
//table create and insert data by dev, served as static data for app to read only
SystemEnums (
    id int,
    key text,
    value text,
    description text,
    created_at datetime
)

Videos (
    id int,
    //if user_id = admin then this video is system video, allow for all user so see and practice on it
    //admin have user_id = -1 and id of all column start from 0 so admin id is truly unique and auto inserted by dev
    //app have 1 admin only
    user_id int, //one users have multiple videos
    youtube_link string,
    created_at datetime,
    filename string, //if store .mp4 on server folders
    blob_data blob, //if store as binary to test as inmemory database
    title string, //youtube title
    description string, //youtube description

)

TranscriptLine (
    id int,
    video_id int, //one video have multiple transcript line
    text string,
    vi_text string, //app only support for english and vietnamese
    start decimal, //convert number to hh:mm:ss easily
    end decimal,
    skip int, //0 = not skip, on = skip
    created_at datetime,
)

Records (
    id int,
    video_id int, //A video is finished 100% is all line is recorded, don't care score of each record
    user_id int, 
    transcript_line_id int, //user A record C1, C2, C3... file on a TranscriptLine D of video B
    filename string, //if store .wav on server folders
    blob_data blob, //if store as binary
    score int, //0 to 100
    duration int, //second of audio file
    stt_text text, //text listened
    stt_provider_key string, //model id when do speech to text, if user record 2 time on same line of different stt models then this design support it
    created_at datetime, //time when user record this
)

Jobs (
  id int, -- auto increment
  user_id int,
  video_id int,
  status text, -- QUEUED, RUNNING, DONE, FAILED
  type text, -- VIDEO_INGEST or TRANSLATION
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

/*
User login
Server verify username, password
Server create token and insert new row in sessions table
Server send response with header Set-Cookie so browser save the same token on cookie
Every new auth requests make server read sessions table to:
- If not expires and valid then continue process
- If expires or no rows then return unauthen 401
/logout also does remove sessions row (Set-Cookie: session=; Max-Age=0   ← tell browser to drop it)
*/
Sessions (
    id          int
    user_id     int
    token       text
    created_at  datetime
    expires_at  datetime
)