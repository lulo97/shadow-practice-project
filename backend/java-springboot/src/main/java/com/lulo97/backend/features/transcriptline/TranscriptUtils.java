package com.lulo97.backend.features.transcriptline;

import java.util.ArrayList;
import java.util.List;
import com.lulo97.backend.Result;

public class TranscriptUtils {

    public static String expectedPrefixSymbol = ":";

    // Expected format: "1: Câu 1\n2: Câu 2\n3: Câu 3"
    public static Result<Boolean> validateViText(String viText) {
        if (viText == null || viText.trim().isEmpty())
            return Result.fail("vi_text is empty.");

        String[] lines = viText.split("\n");
        List<String> nonEmptyLines = new ArrayList<>();
        for (String l : lines) {
            if (!l.trim().isEmpty()) {
                nonEmptyLines.add(l);
            }
        }

        for (int i = 0; i < nonEmptyLines.size(); i++) {
            String line = nonEmptyLines.get(i).trim();
            String expectedPrefix = (i + 1) + expectedPrefixSymbol;

            if (!line.startsWith(expectedPrefix))
                return Result.fail(String.format("Line %d must start with \"%s\". Got: \"%s\"",
                        i + 1, expectedPrefix, line));

            String content = line.substring(expectedPrefix.length()).trim();
            if (content.isEmpty())
                return Result.fail(
                        String.format("Line %d has no content after the number prefix.", i + 1));
        }

        return Result.ok(true);
    }

    // Strips the "1. ", "2. " prefixes and returns clean text list
    public static List<String> parseViText(String viText) {
        String[] lines = viText.split("\n");
        List<String> result = new ArrayList<>();

        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty())
                continue;

            int dotIndex = trimmed.indexOf(expectedPrefixSymbol);
            String value = dotIndex >= 0 ? trimmed.substring(dotIndex + 1).trim() : trimmed;
            result.add(value);
        }

        return result;
    }

    public static String buildTranscriptForLlm(List<TranscriptLine> transcriptLines) {
        StringBuilder output = new StringBuilder();
        for (int i = 0; i < transcriptLines.size(); i++) {
            output.append(i + 1).append(expectedPrefixSymbol).append(" ")
                    .append(transcriptLines.get(i).getText()).append("\n");
        }
        return output.toString();
    }
}
