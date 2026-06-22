using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

public class VideoUtilsYtdlp : IVideoUtils
{
    public VideoStreamResult LinkToVideo(string link)
    {
        int h = 720;
        string ext = "mp4";

        string seperator = "|||";

        string arguments = $"--no-warnings --print \"%(id)s{seperator}%(title)s\" -f \"bestvideo[height={h}][ext={ext}]+bestaudio[ext=m4a]/best[height={h}][ext={ext}]\" -o - \"{link}\"";

        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = "yt-dlp",
            Arguments = arguments,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        Process? process = Process.Start(startInfo);
        if (process == null)
            throw new Exception("Failed to start yt-dlp process.");

        string? metadataLine = null;

        //Core concept = Using background thread to read stderr, using main thread to store final output data
        //Init video metadata ready is false
        var metadataReady = new ManualResetEventSlim(false);

        // Create new thread using Task.Run()
        // Read stderr on a background thread
        var stderrTask = Task.Run(() =>
        {
            while (true)
            {
                string? line = process.StandardError.ReadLine();
                if (line == null)
                {
                    break; //End of stream
                }
            
                Console.WriteLine($"[yt-dlp stderr]: {line}");

                if (metadataLine == null && line.Contains(seperator))
                {
                    metadataLine = line;
                    metadataReady.Set();
                }
            }
        });

        // Block main thread until metadata is found OR stderr is closed (process exited/crashed)
        metadataReady.Wait();

        if (string.IsNullOrWhiteSpace(metadataLine))
        {
            process.WaitForExit();
            throw new Exception("Failed to find yt-dlp metadata line in stderr.");
        }

        //Run after metadataReady.Set();
        string[] parts = metadataLine.Split(new[] { seperator }, StringSplitOptions.None);
        string id = parts[0].Trim();
        string title = parts[1].Trim();

        return new VideoStreamResult
        {
            Id = id,
            Title = title,
            Stream = process.StandardOutput.BaseStream //Must close this zombie process when use
        };
    }
}