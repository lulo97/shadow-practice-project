
using static YtdlpUtils;

public static class SeedSystemVideos
{
    private static string SYSTEM_VIDEOS_PATH = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\system_videos";
    private static string TEST_USER_VIDEOS_PATH = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\test_user_videos";

    public static async Task RunAsync(IServiceScope scope, bool is_system_videos)
    {

        string[] subdirectoryPaths = Directory.GetDirectories(is_system_videos ? SYSTEM_VIDEOS_PATH : TEST_USER_VIDEOS_PATH);

        foreach (string path in subdirectoryPaths)
        {
            string folderName = Path.GetFileName(path);
            string youtube_id = folderName;
            string file_mp4_path = Directory.GetFiles(path, "*.mp4").Single();
            string file_jpg_path = Directory.GetFiles(path, "*.jpg").Single();
            string file_vtt_path = Directory.GetFiles(path, "*.en.vtt").Single();
            string file_vtt_vi_path = Directory.GetFiles(path, "*.vi.vtt").Single();
            string file_metadata_path = Directory.GetFiles(path, "*.metadata.txt").Single();

            byte[] videoBytes = File.ReadAllBytes(file_mp4_path);
            byte[] imageBytes = File.ReadAllBytes(file_jpg_path);
            List<TranscriptLineFormat> subtitleText = YtdlpUtils.ParseTranscript(File.ReadAllText(file_vtt_path));
            List<TranscriptLineFormat> subtitleTextVi = YtdlpUtils.ParseTranscript(File.ReadAllText(file_vtt_vi_path));
            string metadataText = File.ReadAllText(file_metadata_path); //Title\nDescription
            string[] lines = metadataText.Split(new[] { "\r\n", "\n" }, 2, StringSplitOptions.None);
            string title = lines.Length > 0 ? lines[0].Trim() : "Untitled";
            string description = lines.Length > 1 ? lines[1].Trim() : "";

            var _context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var _videoWriter = scope.ServiceProvider.GetRequiredService<IVideoFileWriter>();

            var new_video = new Video { UserId = is_system_videos ? Utils.ADMIN_ID : Utils.TEST_USER_ID, YoutubeId = youtube_id, Title = title, Description = description };

            _context.Videos.Add(new_video);

            await _context.SaveChangesAsync();

            var result_video_data = await _videoWriter.WriteVideoAsync(new_video.Id, _context, videoBytes);

            if (!result_video_data.success)
            {
                throw new Exception(result_video_data.error);
            }

            var result_video_thumbnail = await _videoWriter.WriteThumbnailAsync(new_video.Id, _context, imageBytes);

            if (!result_video_thumbnail.success)
            {
                throw new Exception(result_video_thumbnail.error);
            }

            _context.TranscriptLines.AddRange(subtitleText.Select((b, i) => new TranscriptLine
            {
                VideoId = new_video.Id,
                LineIndex = i,
                Text = b.Text,
                ViText = subtitleTextVi[i].Text,
                Start = b.Start,
                End = b.End,
                Skip = 0
            }));

            await _context.SaveChangesAsync();
        }

    }
}