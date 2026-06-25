public static class TranscriptUtils
{
    public static string expectedPrefixSymbol = ":";

    // Expected format: "1. Câu 1\n2. Câu 2\n3. Câu 3"
    public static (bool is_valid, string message) ValidateViText(string vi_text)
    {
        if (string.IsNullOrWhiteSpace(vi_text))
            return (false, "vi_text is empty.");

        var lines = vi_text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        for (int i = 0; i < lines.Length; i++)
        {
            var line = lines[i].Trim();
            var expectedPrefix = $"{i + 1}{expectedPrefixSymbol}";

            if (!line.StartsWith(expectedPrefix))
                return (false, $"Line {i + 1} must start with \"{expectedPrefix}\". Got: \"{line}\"");

            var content = line.Substring(expectedPrefix.Length).Trim();
            if (string.IsNullOrWhiteSpace(content))
                return (false, $"Line {i + 1} has no content after the number prefix.");
        }

        return (true, "Valid");
    }

    // Strips the "1. ", "2. " prefixes and returns clean text list
    public static List<string> ParseViText(string vi_text)
    {
        var lines = vi_text.Split('\n', StringSplitOptions.RemoveEmptyEntries);

        return lines
            .Select(line =>
            {
                var trimmed = line.Trim();
                var dotIndex = trimmed.IndexOf(expectedPrefixSymbol);
                return dotIndex >= 0
                    ? trimmed.Substring(dotIndex + 1).Trim()
                    : trimmed;
            })
            .ToList();
    }

    public static string BuildTranscriptForLlm(List<TranscriptLine> transcriptLines)
    {
        var output = "";
        for (int i = 0; i < transcriptLines.Count; i++)
        {
            output += $"{i + 1}{expectedPrefixSymbol} {transcriptLines[i]}\n";
        }
        return output;
    }
}
