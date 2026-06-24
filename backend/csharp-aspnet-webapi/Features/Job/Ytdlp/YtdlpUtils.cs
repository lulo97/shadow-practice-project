
using System.Text.RegularExpressions;

public static class YtdlpUtils
{
    public static List<TranscriptLineFormat> ParseTranscript(string vttContent)
    {
        var lines = new List<TranscriptLineFormat>();
        var tagPattern = new Regex(@"<[^>]+>", RegexOptions.Compiled);
        var timePattern = new Regex(
            @"(\d{2}:\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}:\d{2}\.\d{3})",
            RegexOptions.Compiled);

        static decimal ToSeconds(string timestamp)
        {
            var t = TimeSpan.Parse(timestamp);
            return (decimal)t.TotalSeconds;
        }

        var raw = vttContent.Split('\n');
        var seen = new HashSet<string>();

        for (int i = 0; i < raw.Length; i++)
        {
            var match = timePattern.Match(raw[i]);
            if (!match.Success) continue;

            var start = ToSeconds(match.Groups[1].Value);
            var end = ToSeconds(match.Groups[2].Value);

            var textLines = new List<string>();
            for (int j = i + 1; j < raw.Length && !string.IsNullOrWhiteSpace(raw[j]); j++)
            {
                var cleaned = tagPattern.Replace(raw[j], "").Trim();
                if (!string.IsNullOrEmpty(cleaned))
                    textLines.Add(cleaned);
            }

            if (textLines.Count == 0) continue;

            var text = textLines[^1];
            var key = $"{start}|{text}";

            if (seen.Add(key))
                lines.Add(new TranscriptLineFormat { Start = start, End = end, Text = text });
        }

        return lines;
    }

    public class TranscriptLineFormat
    {
        public decimal Start { get; set; }  // seconds, e.g. 0.654
        public decimal End { get; set; }  // seconds, e.g. 6.910
        public string Text { get; set; }  // plain text, tags stripped
    }
}
