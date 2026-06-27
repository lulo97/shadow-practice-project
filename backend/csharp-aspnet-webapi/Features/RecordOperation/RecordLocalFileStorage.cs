using Microsoft.EntityFrameworkCore;

public class RecordLocalFileStorage : IRecordFileWriter
{
    public async Task<(bool success, string? error)> WriteAudioAsync(int recordId, AppDbContext db, byte[] fileBytes)
    {
        var record = await db.Records.FirstOrDefaultAsync(x => x.Id == recordId);
        if (record == null) return (false, $"Record with ID {recordId} not found.");

        try
        {
            if (!Directory.Exists(Utils.LOCAL_FILE_PATH))
                Directory.CreateDirectory(Utils.LOCAL_FILE_PATH);

            string generatedFileName = $"record_{recordId}_{Guid.NewGuid()}.mp3";
            string destinationPath = Path.Combine(Utils.LOCAL_FILE_PATH, generatedFileName);

            await File.WriteAllBytesAsync(destinationPath, fileBytes);

            record.FilePath = generatedFileName;
            await db.SaveChangesAsync();

            return (true, null);
        }
        catch (Exception ex)
        {
            return (false, $"Failed to save audio: {ex.Message}");
        }
    }
}