using Microsoft.EntityFrameworkCore;

public class RecordDatabaseStorage : IRecordFileWriter
{
    public async Task<(bool success, string? error)> WriteAudioAsync(int recordId, AppDbContext db, byte[] fileBytes)
    {
        var record = await db.Records.FirstOrDefaultAsync(x => x.Id == recordId);
        if (record == null) return (false, $"Record with ID {recordId} not found.");

        record.BlobData = fileBytes;
        await db.SaveChangesAsync();
        return (true, null);
    }
}