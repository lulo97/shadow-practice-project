
public static class SttUtils
{
    public static int GetScore(string original_text, string tts_test)
    {
        // 1. Handle edge cases or empty strings
        if (string.IsNullOrEmpty(original_text) && string.IsNullOrEmpty(tts_test))
            return 100;

        if (string.IsNullOrEmpty(original_text) || string.IsNullOrEmpty(tts_test))
            return 0;

        // 2. Normalize text for fair TTS comparison (case-insensitive, trimmed)
        string source = original_text.Trim().ToLower();
        string target = tts_test.Trim().ToLower();

        // If they are identical after normalization, it's a perfect match
        if (source == target)
            return 100;

        // 3. Calculate Levenshtein Distance (Optimized Row-by-Row)
        int m = source.Length;
        int n = target.Length;

        int[] prevRow = new int[n + 1];
        int[] currRow = new int[n + 1];

        for (int j = 0; j <= n; j++)
        {
            prevRow[j] = j;
        }

        for (int i = 1; i <= m; i++)
        {
            currRow[0] = i;
            for (int j = 1; j <= n; j++)
            {
                int cost = (source[i - 1] == target[j - 1]) ? 0 : 1;

                currRow[j] = Math.Min(
                    Math.Min(currRow[j - 1] + 1,    // Insertion
                             prevRow[j] + 1),       // Deletion
                    prevRow[j - 1] + cost           // Substitution
                );
            }

            // Move to the next row: copy currRow to prevRow
            Array.Copy(currRow, prevRow, n + 1);
        }

        int distance = prevRow[n];

        // 4. Convert distance to a 0-100 similarity percentage score
        int maxLength = Math.Max(m, n);
        double similarity = (double)(maxLength - distance) / maxLength;

        return (int)Math.Round(similarity * 100);
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

