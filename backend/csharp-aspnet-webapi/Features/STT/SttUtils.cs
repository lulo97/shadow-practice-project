
public static class SttUtils
{
    public static int GetScore(string original_text, string tts_test)
    {
        return 100;
    }

    public static async Task<byte[]> ConvertToWavAsync(byte[] inputBytes)
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

