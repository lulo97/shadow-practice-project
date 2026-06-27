public interface IRecordFileWriter
{
    Task<(bool success, string? error)> WriteAudioAsync(int recordId, AppDbContext db, byte[] fileBytes);
}