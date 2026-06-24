Users (
id int, //auto increment
username string,
password\_hashed string,
created\_at datetime
)

UserSettings (
id int, //keep all table have id column for consistancy
user\_id int,
stt\_provider\_key string, //id of stt provider, ref to SystemEnums.key, example WHISPER\_CPP = key
volume int, //0 to 100
record\_screen\_ui\_style string, //ONE\_SENTENCE or MULTIPLE\_SENTENCE
loop int, //0 = off, 1 = on
video\_width\_size int, //10% - 90%
)

//STT provider id stored here
//record\_screen\_ui\_style stored here
//table create and insert data by dev, served as static data for app to read only
SystemEnums (
id int,
key text,
value text,
description text,
created\_at datetime
)

Videos (
id int,
//if user\_id = admin then this video is system video, allow for all user so see and practice on it
//admin have user\_id = -1 and id of all column start from 0 so admin id is truly unique and auto inserted by dev
//app have 1 admin only
user\_id int, //one users have multiple videos
youtube\_id string, //https://www.youtube.com/watch?v=youtube\_id
created\_at datetime,
filename string, //if store .mp4 on server folders
blob\_data blob, //if store as binary to test as inmemory database
title string, //youtube title
description string, //youtube description

)

TranscriptLine (
id int,
video\_id int, //one video have multiple transcript line
text string,
vi\_text string, //app only support for english and vietnamese
start decimal, //convert number to hh:mm:ss easily
end decimal,
skip int, //0 = not skip, on = skip
created\_at datetime,
)

Records (
id int,
video\_id int, //A video is finished 100% is all line is recorded, don't care score of each record
user\_id int,
transcript\_line\_id int, //user A record C1, C2, C3... file on a TranscriptLine D of video B
filename string, //if store .wav on server folders
blob\_data blob, //if store as binary
score int, //0 to 100
duration int, //second of audio file
stt\_text text, //text listened
stt\_provider\_key string, //model id when do speech to text, if user record 2 time on same line of different stt models then this design support it
created\_at datetime, //time when user record this
)

Jobs (
id int, -- auto increment
user\_id int,
video\_id int,
status text, -- QUEUED, RUNNING, DONE, FAILED
type text, -- VIDEO\_INGEST or TRANSLATION
created\_at datetime
)

JobSteps (
id int,
job\_id int,
step text, -- DOWNLOAD, EXTRACT\_AUDIO, ASR, STORE\_LINES
status text, -- PENDING, RUNNING, DONE, FAILED, SKIPPED
error\_msg text,
started\_at datetime,
ended\_at datetime
)

/\*
User login
Server verify username, password
Server create token and insert new row in sessions table
Server send response with header Set-Cookie so browser save the same token on cookie
Every new auth requests make server read sessions table to:

* If not expires and valid then continue process
* If expires or no rows then return unauthen 401
/logout also does remove sessions row (Set-Cookie: session=; Max-Age=0   ← tell browser to drop it)
\*/
Sessions (
id          int
user\_id     int
token       text
created\_at  datetime
expires\_at  datetime
)

