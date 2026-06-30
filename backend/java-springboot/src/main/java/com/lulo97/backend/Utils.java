package com.lulo97.backend;

import java.net.URI;
import java.net.URISyntaxException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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

    public static Result<Boolean> isYoutubeIdValid(String url) {
        // 1. Check for null or empty
        if (url == null || url.trim().isEmpty()) {
            return Result.fail("URL cannot be empty.");
        }

        // 2. Validate URI format
        URI uri;
        try {
            uri = new URI(url);
        } catch (URISyntaxException e) {
            return Result.fail("URL is not a valid absolute URI.");
        }

        if (uri.getScheme() == null ||
                (!uri.getScheme().equalsIgnoreCase("http") &&
                        !uri.getScheme().equalsIgnoreCase("https"))) {
            return Result.fail("URL is not a valid absolute URI.");
        }

        // 3. Validate Domain
        String host = uri.getHost();
        if (host == null ||
                (!host.equals("www.youtube.com") && !host.equals("youtube.com"))) {
            return Result.fail("Domain must be youtube.com or www.youtube.com.");
        }

        // 4. Validate Path
        if (!"/watch".equals(uri.getPath())) {
            return Result.fail("Path must be /watch.");
        }

        return Result.ok(true);
    }

    public static String getYoutubeId(String url) {
        Result<Boolean> result = isYoutubeIdValid(url);

        if (!result.getSuccess()) {
            return null;
        }

        try {
            URI uri = new URI(url);
            String query = uri.getQuery();

            if (query == null) {
                return null;
            }

            for (String param : query.split("&")) {
                String[] pair = param.split("=", 2);

                if (pair.length == 2 && pair[0].equals("v")) {
                    return URLDecoder.decode(
                            pair[1],
                            StandardCharsets.UTF_8);
                }
            }

        } catch (URISyntaxException e) {
            return null;
        }

        return null;
    }
}
