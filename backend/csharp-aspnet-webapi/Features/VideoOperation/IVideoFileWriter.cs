public interface IVideoFileWriter
{
    Task<(bool success, string? error)> WriteThumbnailAsync(int videoId, AppDbContext db, byte[] fileBytes);
    Task<(bool success, string? error)> WriteAudioAsync(int videoId, AppDbContext db, byte[] fileBytes);
    Task<(bool success, string? error)> WriteVideoAsync(int videoId, AppDbContext db, byte[] fileBytes);
}