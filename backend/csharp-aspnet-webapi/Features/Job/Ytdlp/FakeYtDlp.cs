using System.Text.RegularExpressions;
using static YtdlpUtils;

public class FakeYtDlp : IYtDlp
{
    public Task<string> GetTitleAsync(string youtubeLink) =>
        Task.FromResult("What causes avalanches, and can you survive them? - Simon Trautman");

    public Task<string> GetDescriptionAsync(string youtubeLink) =>
        Task.FromResult("Explore the three conditions needed to trigger an avalanche, and what makes these natural disasters so hard to survive.\r\n");

    public async Task<byte[]> DownloadVideoAsync(string youtubeLink)
    {
        string filePath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\6hCo4S_1Fhw.mp4";

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Video file not found.", filePath);
        }

        return await File.ReadAllBytesAsync(filePath);
    }

    public bool HasBuiltInTranscript { get; set; } = true; // toggle in tests

    public async Task<List<TranscriptLineFormat>> FetchBuiltInTranscriptAsync(string youtubeLink)
    {
        var content = await File.ReadAllTextAsync(@"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\6hCo4S_1Fhw.vtt");
        return ParseTranscript(content);
    }


    public async Task<byte[]> DownloadAudioAsync(string youtubeLink)
    {
        // Path to your audio file
        string filePath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\6hCo4S_1Fhw.mp3";

        // Verify the file exists before reading
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException("Audio file not found.", filePath);
        }

        // Read the file asynchronously
        return await File.ReadAllBytesAsync(filePath);
    }
}