using System;
using System.Diagnostics;
using System.IO;

public class VideoUtilsPytubefix : IVideoUtils
{
    public VideoStreamResult LinkToVideo(string link)
    {
        // Python code writes metadata string to stderr, and binary video to stdout buffer
        string pythonCode = "import sys; from pytubefix import YouTube; " +
                            $"yt = YouTube('{link}'); " +
                            "sys.stderr.write(f'{yt.video_id}|||{yt.title}\\n'); sys.stderr.flush(); " +
                            "stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first(); " +
                            "stream.stream_to_buffer(sys.stdout.buffer)";

        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = "python",
            Arguments = $"-c \"{pythonCode}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true, // Critical: we intercept metadata text here
            UseShellExecute = false,
            CreateNoWindow = true
        };

        Process? process = Process.Start(startInfo);
        if (process == null)
        {
            throw new Exception("Failed to start Python pytubefix process.");
        }

        // 1. Fetch metadata tokens directly from the process Standard Error stream line
        string? metadataLine = process.StandardError.ReadLine();
        if (string.IsNullOrWhiteSpace(metadataLine) || !metadataLine.Contains("|||"))
        {
            throw new Exception("Failed to parse pytubefix metadata from stderr channel.");
        }

        string[] parts = metadataLine.Split(new[] { "|||" }, StringSplitOptions.None);
        string id = parts[0].Trim();
        string title = parts[1].Trim();

        // 2. Consume any downstream python errors to keep console logs healthy
        process.ErrorDataReceived += (sender, e) => {
            if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine($"[Python Log]: {e.Data}");
        };
        process.BeginErrorReadLine();

        // 3. Return the result housing the untouched raw stdout binary video stream
        return new VideoStreamResult
        {
            Id = id,
            Title = title,
            Stream = process.StandardOutput.BaseStream
        };
    }
}