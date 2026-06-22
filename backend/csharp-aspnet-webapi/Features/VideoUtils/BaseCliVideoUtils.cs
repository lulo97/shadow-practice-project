using System;
using System.Diagnostics;
using System.IO;

public abstract class BaseCliVideoUtils : IVideoUtils
{
    //This can be any CLI tools, like you-get or ytb-dl
    protected abstract string ExecutableName { get; }
    protected abstract string BuildArguments(string link);

    public Stream LinkToVideo(string link)
    {
        ProcessStartInfo startInfo = new ProcessStartInfo
        {
            FileName = ExecutableName,
            Arguments = BuildArguments(link),
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        Process? process = Process.Start(startInfo);
        
        if (process == null)
        {
            throw new Exception($"Failed to start {ExecutableName} process.");
        }

        process.ErrorDataReceived += (sender, e) => {
            if (!string.IsNullOrEmpty(e.Data)) Console.WriteLine($"[{ExecutableName} Error]: {e.Data}");
        };
        process.BeginErrorReadLine();

        return process.StandardOutput.BaseStream;
    }
}
