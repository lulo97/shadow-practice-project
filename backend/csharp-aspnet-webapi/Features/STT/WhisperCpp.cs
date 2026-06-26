using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;

public class WhisperCpp : ISTT
{
    private readonly string _port;
    private readonly HttpClient _http;

    public WhisperCpp(string port = "8080")
    {
        _port = port;
        _http = new HttpClient
        {
            BaseAddress = new Uri($"http://localhost:{_port}"),
            Timeout = TimeSpan.FromSeconds(30)
        };
    }

    // ── 1. Check server is reachable ──────────────────────────────────────
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

    // ── 2. Check a model is loaded ────────────────────────────────────────
    public async Task<bool> IsModelLoadedAsync()
    {
        try
        {
            var response = await _http.GetAsync("/health");
            if (!response.IsSuccessStatusCode) return false;

            var json = await response.Content.ReadFromJsonAsync<JsonElement>();

            // whisper.cpp returns { "status": "ok" } when model is loaded
            // and { "status": "no model loaded" } when it isn't
            if (json.TryGetProperty("status", out var status))
                return status.GetString() == "ok";

            return false;
        }
        catch
        {
            return false;
        }
    }

    // ── 3. Speech-to-Text ─────────────────────────────────────────────────
    public async Task<string> RunAsync(byte[] blob)
    {
        if (!await IsServerOnAsync())
            throw new InvalidOperationException("Whisper.cpp server is not running.");

        if (!await IsModelLoadedAsync())
            throw new InvalidOperationException("No model loaded in whisper.cpp server.");

        // Convert incoming audio (WebM/Opus, MP4, etc.) → 16kHz mono WAV
        var wavBytes = await SttUtils.ConvertToWavAsync(blob);

        using var content = new MultipartFormDataContent();
        using var audioContent = new ByteArrayContent(wavBytes);

        audioContent.Headers.ContentType =
            new System.Net.Http.Headers.MediaTypeHeaderValue("audio/wav");

        content.Add(audioContent, "file", "audio.wav");
        content.Add(new StringContent("json"), "response_format");

        var response = await _http.PostAsync("/inference", content);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        if (json.TryGetProperty("text", out var text))
            return text.GetString()?.Trim() ?? string.Empty;

        throw new InvalidOperationException("Unexpected response from whisper.cpp.");
    }

    public string GetKey()
    {
        return "WHISPER_CPP";
    }
}