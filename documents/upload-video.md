1. Frontend:
- User can upload file through <input />
- User can paste youtube link through <input />

2. HTTP
- Frontend send request { file } to POST /v1/videos
- Frontend send request { link } to POST /v1/videos

3. Backend
- 3.1 If request contains link, then use ytb-dl to get youtube video file
    + use ytb-dl just a method, there are different method? (yt-dlp, you-get, ytdl-go, wolfXytdl or pytubefix...)
- 3.2 Get the video file, need to:
    + Save it:
    + Load it:
    + Delete it:
    + This can be store in memory, in database engine, in plain text file, store as files in folders

4. Conclusion interfaces need to be implement:
- IVideoUtils
    + LinkToVideo(link: string) -> video mp4 file
- IVideoCRUD
    + Save(file) -> { success: bool, error: string }
    + Load(video_id) -> { file }
    + LoadList(title, from, to) -> List<file>
    + Delete(video_id) -> { success: bool, error: string }