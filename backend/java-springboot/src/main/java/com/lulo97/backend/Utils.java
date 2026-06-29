package com.lulo97.backend;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class Utils {
    public static String ADMIN_USERNAME = "admin";
    public static String TEST_USERNAME = "alice-java";
    public static String SESSION_TOKEN = "session_token";
    public static String LOCAL_FILE_PATH = "Files";

    public static List<TranscriptLineFormat> ParseTranscript(String vttContent) {
        // Normalize all line endings to \n first
        vttContent = vttContent.replace("\r\n", "\n")
                .replace("\r", "\n");

        List<TranscriptLineFormat> result = new ArrayList<>();

        Pattern blockPattern = Pattern.compile(
                "(\\d{2}:\\d{2}:\\d{2}\\.\\d+)\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2}\\.\\d+)[^\\n]*\\n([\\s\\S]*?)(?=\\n\\n|\\z)",
                Pattern.MULTILINE);

        Pattern tagPattern = Pattern.compile("<[^>]+>");

        Matcher matcher = blockPattern.matcher(vttContent);

        while (matcher.find()) {
            String text = tagPattern.matcher(matcher.group(3))
                    .replaceAll("")
                    .replace("\r", " ")
                    .replace("\n", " ")
                    .trim();

            if (text.isEmpty()) {
                continue;
            }

            result.add(new TranscriptLineFormat(
                    ParseTimestamp(matcher.group(1)),
                    ParseTimestamp(matcher.group(2)),
                    text));
        }

        return result;
    }

    private static double ParseTimestamp(String ts) {
        // HH:MM:SS.mmm -> total seconds
        String[] parts = ts.split(":");

        double hours = Double.parseDouble(parts[0]);
        double minutes = Double.parseDouble(parts[1]);
        double seconds = Double.parseDouble(parts[2]);

        return hours * 3600 + minutes * 60 + seconds;
    }

    public static class TranscriptLineFormat {
        public double Start; // seconds, e.g. 0.654
        public double End; // seconds, e.g. 6.910
        public String Text; // plain text, tags stripped

        public TranscriptLineFormat(double start, double end, String text) {
            this.Start = start;
            this.End = end;
            this.Text = text;
        }
    }
}
