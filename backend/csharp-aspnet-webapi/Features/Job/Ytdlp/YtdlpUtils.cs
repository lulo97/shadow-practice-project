using System.Text.RegularExpressions;

public static class YtdlpUtils
{
    public static List<TranscriptLineFormat> ParseTranscript(string vttContent)
    {
        // Normalize all line endings to \n first
        vttContent = vttContent.Replace("\r\n", "\n").Replace("\r", "\n");

        var result = new List<TranscriptLineFormat>();

        var blockPattern = new Regex(
            @"(\d{2}:\d{2}:\d{2}\.\d+)\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d+)[^\n]*\n([\s\S]*?)(?=\n\n|\z)",
            RegexOptions.Multiline);

        var tagPattern = new Regex(@"<[^>]+>");

        foreach (Match match in blockPattern.Matches(vttContent))
        {
            var text = tagPattern.Replace(match.Groups[3].Value, "")
                .Replace("\r", " ")
                .Replace("\n", " ")
                .Trim();

            if (string.IsNullOrWhiteSpace(text))
                continue;

            result.Add(new TranscriptLineFormat
            {
                Start = ParseTimestamp(match.Groups[1].Value),
                End = ParseTimestamp(match.Groups[2].Value),
                Text = text
            });
        }

        return result;
    }

    private static decimal ParseTimestamp(string ts)
    {
        // HH:MM:SS.mmm  →  total seconds
        var parts = ts.Split(':');
        decimal hours = decimal.Parse(parts[0]);
        decimal minutes = decimal.Parse(parts[1]);
        decimal seconds = decimal.Parse(parts[2], System.Globalization.CultureInfo.InvariantCulture);
        return hours * 3600 + minutes * 60 + seconds;
    }

    public class TranscriptLineFormat
    {
        public decimal Start { get; set; }  // seconds, e.g. 0.654
        public decimal End { get; set; }  // seconds, e.g. 6.910
        public string Text { get; set; }  // plain text, tags stripped
    }

    public class YtDlpResult<T>
    {
        public bool Success { get; init; }
        public T? Data { get; init; }
        public string? Error { get; init; }

        public static YtDlpResult<T> Ok(T data) => new() { Success = true, Data = data };
        public static YtDlpResult<T> Fail(string error) => new() { Success = false, Error = error };
    }
}