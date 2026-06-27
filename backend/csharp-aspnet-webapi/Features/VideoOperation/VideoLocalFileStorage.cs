using Microsoft.EntityFrameworkCore;

public class VideoLocalFileStorage : IVideoFileWriter
{
    private static void EnsureDirectoryExists(string path)
    {
        if (!Directory.Exists(path))
            Directory.CreateDirectory(path);
    }

    public async Task<(bool success, string? error)> WriteThumbnailAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId);
        if (video == null) return (false, $"Video with ID {videoId} not found.");

        try
        {
            EnsureDirectoryExists(Utils.LOCAL_FILE_PATH);

            string generatedFileName = $"{video.YoutubeId}_{Guid.NewGuid()}.jpg";
            string destinationPath = Path.Combine(Utils.LOCAL_FILE_PATH, generatedFileName);

            await File.WriteAllBytesAsync(destinationPath, fileBytes);

            video.ThumbnailFileName = generatedFileName;
            await db.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to save thumbnail: {ex.Message}");
        }
    }

    public async Task<(bool success, string? error)> WriteAudioAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId);
        if (video == null) return (false, $"Video with ID {videoId} not found.");

        try
        {
            EnsureDirectoryExists(Utils.LOCAL_FILE_PATH);

            string generatedFileName = $"{video.YoutubeId}_{Guid.NewGuid()}.mp3";
            string destinationPath = Path.Combine(Utils.LOCAL_FILE_PATH, generatedFileName);

            await File.WriteAllBytesAsync(destinationPath, fileBytes);

            video.AudioFilename = generatedFileName;
            await db.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to save audio: {ex.Message}");
        }
    }

    public async Task<(bool success, string? error)> WriteVideoAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId);
        if (video == null) return (false, $"Video with ID {videoId} not found.");

        try
        {
            EnsureDirectoryExists(Utils.LOCAL_FILE_PATH);

            string generatedFileName = $"{video.YoutubeId}_{Guid.NewGuid()}.mp4";
            string destinationPath = Path.Combine(Utils.LOCAL_FILE_PATH, generatedFileName);

            await File.WriteAllBytesAsync(destinationPath, fileBytes);

            video.Filename = generatedFileName;
            await db.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to save video: {ex.Message}");
        }
    }
}