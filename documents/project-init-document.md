SHADOW PRACTICE PROJECT
- Core idea is to create an application for user to practice english speaking with "shadow" technique.
- Shadow technique a learning method where you repeat what a native speaker say and try to be close as possible with original speech.

FUNCTIONS:
- Target users are Vietnamese people who like to practice English.
- A user select an video or an audio to listen and repeat.
- Videos can be fetch from youtube or other similar platform, or can be imported as files or links.
    + Users can select existed video database from application or import their own.
- A video or audio can be extracted to get a transcript which is segments of text with start time and end time. This process involves Automatic Speech Recognition (ASR) in timestamps level.
    + If a youtube already have transcription then just fetch it directly
    + If a youtube don't have transcription or a imported file then user ASR model to get transcription
- A user can pick a segment to play from start time to end time, this allow users can practice on a short amount of audio.
- A user can practice speaking and application with save audio file to extract text from there. This process involves speech-to-text (STT) technology. This allow users can verdict their own speaking skill.
- A user can select multiple different speech to text models to get an objective verdiction.
    + If current STT model quality is bad then user can select a better STT model
- A user can see video and see english transcript and vietnamese transcript to understand about the content of current segment audio. 
    + If a youtube already have vietnamese transcription then just fetch it directly
    + If a youtube don't have transcription or a imported file then from english transcription, using translator like LLM from server or user own translation to get vietnamese transcript
- Users can change audio volume of application, this allow application volume to be independent from other application.
- Users can jump into next unrecorded segment to continue practice from where they left
- Users can jump into next unfinished video to continue practice from where they left  
- Users can select loop mode to listen on a audio segment if they didn't heard it clearly yet.
- Users can adjust video play speed if they didn't heard it clearly yet.

USER INTERFACE:
- Application will have 2 screen, one screen for interact with videos, the other screen for practice speaking on a specific video.
- Application will have 2 language: english and vietnamese
- Application will have 2 mode: dark and light

TECHNOLOGIES:
- Application will be served through website on browser with frontend code and backend code will be 2 different instance. They will exchange data through HTTP protocal follow RESTful API style.
- Database can be SQL or NoSQL
- Videos can be stored as files or base64 strings

USERS FLOW:
1. Add a video/a audio through youtube links or an .mp4 file
2. Click on that video to go to practice screen
3. Click on a segment to listen
4. Click on listen button to record
5. View verdiction and repeat listen and repeat of needed
6. Continue on next segment and finish that video.

API DOCUMENT:

GET /v1/health
    + Input = none
    + Output = { message: "ok" }
    + Status = 200 if success
    + Status = 500 if not success and specific error string will be return to user

POST /v1/videos
    + Input = file (blob), link (string)
    + Output = { error: string } for client, server will save videos as files
    + Status = 201 if successfully created
    + Status = 500 if not success and specific error string will be return to user
    