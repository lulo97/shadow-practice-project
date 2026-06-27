using System.Diagnostics;
using static FakeYtDlp;
using static YtdlpUtils;

public class YtDlpCli : IYtDlp
{
    public async Task<YtDlpResult<byte[]>> GetThumbnailAsync(string youtubeLink)
    {
        string tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);

        try
        {
            string outputTemplate = Path.Combine(tempDir, "thumb.%(ext)s");
            var run = await RunAsync($"--write-thumbnail --skip-download --convert-thumbnails jpg -o \"{outputTemplate}\" --no-playlist", youtubeLink);
            if (!run.Success) return YtDlpResult<byte[]>.Fail(run.Error!);

            var thumbnailFile = Directory.GetFiles(tempDir, "thumb.jpg").FirstOrDefault();
            if (thumbnailFile == null)
                return YtDlpResult<byte[]>.Fail("Thumbnail file was not created after download.");

            return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(thumbnailFile));
        }
        catch (Exception ex)
        {
            return YtDlpResult<byte[]>.Fail($"Unexpected error: {ex.Message}");
        }
        finally
        {
            if (Directory.Exists(tempDir)) Directory.Delete(tempDir, true);
        }
    }

    public async Task<YtDlpResult<string>> GetTitleAsync(string youtubeLink) =>
        await RunAsync("--print title", youtubeLink);

    public async Task<YtDlpResult<string>> GetDescriptionAsync(string youtubeLink) =>
        await RunAsync("--print description", youtubeLink);

    public async Task<YtDlpResult<byte[]>> DownloadVideoAsync(string youtubeLink)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp4");
        try
        {
            var run = await RunAsync($"-f \"bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]\" -o \"{tempFile}\" --no-playlist", youtubeLink);
            if (!run.Success) return YtDlpResult<byte[]>.Fail(run.Error!);

            if (!File.Exists(tempFile))
                return YtDlpResult<byte[]>.Fail("Video file was not created after download.");

            return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(tempFile));
        }
        catch (Exception ex)
        {
            return YtDlpResult<byte[]>.Fail($"Unexpected error: {ex.Message}");
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    public async Task<YtDlpResult<List<TranscriptLineFormat>>> FetchBuiltInTranscriptAsync(string youtubeLink)
    {
        var tempDir = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
        Directory.CreateDirectory(tempDir);
        try
        {
            var run = await RunAsync(
                $"--skip-download --write-subs --sub-lang en --sub-format vtt -o \"{tempDir}/sub\"",
                youtubeLink);
            if (!run.Success) return YtDlpResult<List<TranscriptLineFormat>>.Fail(run.Error!);

            var vttFile = Directory.GetFiles(tempDir, "*.vtt").FirstOrDefault();
            if (vttFile == null)
                return YtDlpResult<List<TranscriptLineFormat>>.Fail("No built-in English subtitles found for this video.");

            var raw = await File.ReadAllTextAsync(vttFile);
            return YtDlpResult<List<TranscriptLineFormat>>.Ok(ParseTranscript(raw));
        }
        catch (Exception ex)
        {
            return YtDlpResult<List<TranscriptLineFormat>>.Fail($"Unexpected error: {ex.Message}");
        }
        finally
        {
            Directory.Delete(tempDir, recursive: true);
        }
    }

    public async Task<YtDlpResult<byte[]>> DownloadAudioAsync(string youtubeLink)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}.mp3");
        try
        {
            var run = await RunAsync(
                $"-f bestaudio -x --audio-format mp3 -o \"{tempFile}\" --no-playlist",
                youtubeLink);
            if (!run.Success) return YtDlpResult<byte[]>.Fail(run.Error!);

            if (!File.Exists(tempFile))
                return YtDlpResult<byte[]>.Fail("Audio file was not created after download.");

            return YtDlpResult<byte[]>.Ok(await File.ReadAllBytesAsync(tempFile));
        }
        catch (Exception ex)
        {
            return YtDlpResult<byte[]>.Fail($"Unexpected error: {ex.Message}");
        }
        finally
        {
            if (File.Exists(tempFile)) File.Delete(tempFile);
        }
    }

    // Returns YtDlpResult<string> so callers can check success before using stdout
    private async Task<YtDlpResult<string>> RunAsync(string arguments, string? url = null)
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
            return YtDlpResult<string>.Fail($"yt-dlp failed (exit {process.ExitCode}): {stderr.Trim()}");

        return YtDlpResult<string>.Ok(stdout);
    }
}