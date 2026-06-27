using Microsoft.EntityFrameworkCore;

public class VideoDatabaseStorage : IVideoFileWriter
{
    private async Task<Video?> FindByIdAsync(int videoId, AppDbContext db)
        => await db.Videos.FirstOrDefaultAsync(x => x.Id == videoId);

    private static string VideoNotFoundMessage(int videoId)
        => $"Video with ID {videoId} not found.";

    public async Task<(bool success, string? error)> WriteThumbnailAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await FindByIdAsync(videoId, db);
        if (video == null) return (false, VideoNotFoundMessage(videoId));

        video.Thumbnail = fileBytes;
        await db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> WriteAudioAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await FindByIdAsync(videoId, db);
        if (video == null) return (false, VideoNotFoundMessage(videoId));

        video.AudioBlobData = fileBytes;
        await db.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool success, string? error)> WriteVideoAsync(int videoId, AppDbContext db, byte[] fileBytes)
    {
        var video = await FindByIdAsync(videoId, db);
        if (video == null) return (false, VideoNotFoundMessage(videoId));

        video.BlobData = fileBytes;
        await db.SaveChangesAsync();
        return (true, null);
    }
}