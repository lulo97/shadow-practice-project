using System.Text.Json;

public class Parakeet : ISTT
{
    private readonly string _port;
    private readonly HttpClient _http;

    public Parakeet(string port = "8082")
    {
        _port = port;
        _http = new HttpClient
        {
            BaseAddress = new Uri($"http://localhost:{_port}"),
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    public async Task<bool> IsServerOnAsync()
    {
        try
        {
            var response = await _http.GetAsync("/health");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    public async Task<string> RunAsync(byte[] blob)
    {
        if (!await IsServerOnAsync())
            throw new InvalidOperationException("Whisper.cpp server is not running.");

        var wavBytes = await SttUtils.ConvertToWavAsync(blob);

        using var content = new MultipartFormDataContent();
        using var audioContent = new ByteArrayContent(wavBytes);

        audioContent.Headers.ContentType =
            new System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav");

        content.Add(audioContent, "file", "audio.wav");
        content.Add(new StringContent("json"), "response_format");

        var response = await _http.PostAsync("/v1/audio/transcriptions", content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (json.TryGetProperty("text", out var text))
            return text.GetString()?.Trim() ?? string.Empty;

        throw new InvalidOperationException("Unexpected response from whisper.cpp.");
    }

    public string GetKey()
    {
        return "PARAKEET";
    }
}

