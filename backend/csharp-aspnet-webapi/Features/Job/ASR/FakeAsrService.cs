using static YtdlpUtils;

public class FakeAsrService : IAsrService
{
    public Task<List<TranscriptLineFormat>> TranscribeAsync(byte[] audioBytes)
    {
        throw new NotImplementedException();
    }
}