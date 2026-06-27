public class RecordLocalFileReader : IRecordFileReader
{
    private readonly string _basePath = Utils.LOCAL_FILE_PATH;

    public async Task<byte[]?> ReadAudioAsync(Record record)
    {
        if (string.IsNullOrEmpty(record.FilePath))
            return null;

        string fullPath = Path.Combine(_basePath, record.FilePath);

        if (!File.Exists(fullPath))
            return null;

        return await File.ReadAllBytesAsync(fullPath);
    }
}