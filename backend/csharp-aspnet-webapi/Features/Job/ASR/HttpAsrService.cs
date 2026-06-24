using System.Net.Http.Headers;
using static YtdlpUtils;

public class HttpAsrService : IAsrService
{
    private readonly HttpClient _httpClient;

    public HttpAsrService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<TranscriptLineFormat>> TranscribeAsync(byte[] audioBytes)
    {
        throw new NotImplementedException();
    }
}