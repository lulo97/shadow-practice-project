public class RecordDatabaseReader : IRecordFileReader
{
    public Task<byte[]?> ReadAudioAsync(Record record)
    {
        if (record.BlobData == null || record.BlobData.Length == 0)
            return Task.FromResult<byte[]?>(null);

        return Task.FromResult<byte[]?>(record.BlobData);
    }
}