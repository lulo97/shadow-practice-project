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
        var wavBytes = await ConvertToWavAsync(blob);

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

    private static async Task<byte[]> ConvertToWavAsync(byte[] inputBytes)
    {
        // Write input to a temp file (ffmpeg needs seekable input for WebM)
        var inputPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.webm");
        var outputPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.wav");

        try
        {
            await File.WriteAllBytesAsync(inputPath, inputBytes);

            var psi = new System.Diagnostics.ProcessStartInfo
            {
                FileName = "ffmpeg",
                Arguments = $"-y -i \"{inputPath}\" -ar 16000 -ac 1 -c:a pcm_s16le \"{outputPath}\"",
                RedirectStandardError = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var proc = System.Diagnostics.Process.Start(psi)
                ?? throw new InvalidOperationException("Failed to start ffmpeg.");

            await proc.WaitForExitAsync();

            if (proc.ExitCode != 0)
            {
                var err = await proc.StandardError.ReadToEndAsync();
                throw new InvalidOperationException($"ffmpeg conversion failed: {err}");
            }

            return await File.ReadAllBytesAsync(outputPath);
        }
        finally
        {
            if (File.Exists(inputPath)) File.Delete(inputPath);
            if (File.Exists(outputPath)) File.Delete(outputPath);
        }
    }
}