using static YtdlpUtils;

public class FakeYtDlp : IYtDlp
{
    private const string AssetsPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets";
    private const string VideoId = "6hCo4S_1Fhw";

    public bool HasBuiltInTranscript { get; set; } = true; // toggle in tests

    public async Task<YtDlpResult<byte[]>> GetThumbnailAsync(string youtubeLink)
    {
        var filePath = Path.Combine(AssetsPath, $"{VideoId}.jpg");

        if (!File.Exists(filePath))
            return YtDlpResult<byte[]>.Fail($"Thumbnail not found at: {filePath}");

        return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(filePath));
    }

    public Task<YtDlpResult<string>> GetTitleAsync(string youtubeLink) =>
        Task.FromResult(YtDlpResult<string>.Ok("What causes avalanches, and can you survive them? - Simon Trautman"));

    public Task<YtDlpResult<string>> GetDescriptionAsync(string youtubeLink) =>
        Task.FromResult(YtDlpResult<string>.Ok("Explore the three conditions needed to trigger an avalanche, and what makes these natural disasters so hard to survive.\r\n"));

    public async Task<YtDlpResult<byte[]>> DownloadVideoAsync(string youtubeLink)
    {
        var filePath = Path.Combine(AssetsPath, $"{VideoId}.mp4");

        if (!File.Exists(filePath))
            return YtDlpResult<byte[]>.Fail($"Video file not found at: {filePath}");

        return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(filePath));
    }

    public async Task<YtDlpResult<List<TranscriptLineFormat>>> FetchBuiltInTranscriptAsync(string youtubeLink)
    {
        if (!HasBuiltInTranscript)
            return YtDlpResult<List<TranscriptLineFormat>>.Fail("No built-in transcript available (HasBuiltInTranscript = false).");

        var filePath = Path.Combine(AssetsPath, $"{VideoId}.vtt");

        if (!File.Exists(filePath))
            return YtDlpResult<List<TranscriptLineFormat>>.Fail($"Transcript file not found at: {filePath}");

        var content = await File.ReadAllTextAsync(filePath);
        return YtDlpResult<List<TranscriptLineFormat>>.Ok(ParseTranscript(content));
    }

    public async Task<YtDlpResult<byte[]>> DownloadAudioAsync(string youtubeLink)
    {
        var filePath = Path.Combine(AssetsPath, $"{VideoId}.mp3");

        if (!File.Exists(filePath))
            return YtDlpResult<byte[]>.Fail($"Audio file not found at: {filePath}");

        return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(filePath));
    }
}