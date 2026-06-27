public interface IRecordFileReader
{
    Task<byte[]?> ReadAudioAsync(Record record);
}