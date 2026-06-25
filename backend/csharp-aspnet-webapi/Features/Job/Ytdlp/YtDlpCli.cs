using System.Diagnostics;
using static FakeYtDlp;
using static YtdlpUtils;

public class YtDlpCli : IYtDlp
{
    public async Task<byte[]> GetThumbnailAsync(string youtubeLink)
    {
        string tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            string outputTemplate = Path.Combine(tempDir, "thumb.%(ext)s");
            await RunAsync($"--write-thumbnail --skip-download --convert-thumbnails jpg -o \"{outputTemplate}\" --no-playlist", youtubeLink);

            var thumbnailFile = Directory.GetFiles(tempDir, "thumb.jpg").FirstOrDefault();

            if (thumbnailFile == null)
                throw new Exception("Thumbnail could not be downloaded.");

            return await File.ReadAllBytesAsync(thumbnailFile);
        }
        finally
        {
            if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
        }
    }
    public Task<string> GetTitleAsync(string youtubeLink) =>
        RunAsync("--print title", youtubeLink);

    public Task<string> GetDescriptionAsync(string youtubeLink) =>
        RunAsync("--print description", youtubeLink);

    public async Task<byte[]> DownloadVideoAsync(string youtubeLink)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp4");
        try
        {
            // 720p: best video up to 720p height + best audio, merged into mp4
            await RunAsync($"-f \"bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]\" -o \"{tempFile}\" --no-playlist", youtubeLink);
            return await File.ReadAllBytesAsync(tempFile);
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    private async Task<string> RunAsync(string arguments, string? url = null)
    {
        var fullArgs = url != null ? $"{arguments} \"{url}\"" : arguments;

        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "yt-dlp",
                Arguments = fullArgs,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            }
        };

        process.Start();
        var stdout = await process.StandardOutput.ReadToEndAsync();
        var stderr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        if (process.ExitCode != 0)
            throw new Exception($"yt-dlp failed (exit {process.ExitCode}): {stderr}");

        return stdout;
    }

    public async Task<List<TranscriptLineFormat>> FetchBuiltInTranscriptAsync(string youtubeLink)
    {
        // --write-auto-subs would get auto-generated, we only want manual/built-in
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        try
        {
            // Download only subtitle file, no video, English only, convert to plain text via vtt
            await RunAsync(
                $"--skip-download --write-subs --sub-lang en --sub-format vtt -o \"{tempDir}/sub\" ",
                youtubeLink);

            var vttFile = Directory.GetFiles(tempDir, "*.vtt").FirstOrDefault();
            if (vttFile == null) return null;

            var raw = await File.ReadAllTextAsync(vttFile);
            return ParseTranscript(raw); // strip timestamps
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    public async Task<byte[]> DownloadAudioAsync(string youtubeLink)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp3");
        try
        {
            await RunAsync(
                $"-f bestaudio -x --audio-format mp3 -o \"{tempFile}\" --no-playlist",
                youtubeLink);
            return await File.ReadAllBytesAsync(tempFile);
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }
}