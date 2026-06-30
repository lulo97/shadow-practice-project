package com.lulo97.backend.features.stt;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

public final class SttUtils {

    private SttUtils() {
        // utility class
    }

    public static int getScore(String originalText, String ttsTest) {
        // 1. Handle edge cases or empty strings
        if (isNullOrEmpty(originalText) && isNullOrEmpty(ttsTest))
            return 100;

        if (isNullOrEmpty(originalText) || isNullOrEmpty(ttsTest))
            return 0;

        // 2. Normalize text for fair TTS comparison (case-insensitive, trimmed)
        String source = originalText.trim().toLowerCase();
        String target = ttsTest.trim().toLowerCase();

        // If they are identical after normalization, it's a perfect match
        if (source.equals(target))
            return 100;

        // 3. Calculate Levenshtein Distance (Optimized Row-by-Row)
        int m = source.length();
        int n = target.length();

        int[] prevRow = new int[n + 1];
        int[] currRow = new int[n + 1];

        for (int j = 0; j <= n; j++) {
            prevRow[j] = j;
        }

        for (int i = 1; i <= m; i++) {
            currRow[0] = i;
            for (int j = 1; j <= n; j++) {
                int cost = (source.charAt(i - 1) == target.charAt(j - 1)) ? 0 : 1;

                currRow[j] = Math.min(
                        Math.min(currRow[j - 1] + 1,    // Insertion
                                 prevRow[j] + 1),        // Deletion
                        prevRow[j - 1] + cost            // Substitution
                );
            }

            // Move to the next row: copy currRow to prevRow
            System.arraycopy(currRow, 0, prevRow, 0, n + 1);
        }

        int distance = prevRow[n];

        // 4. Convert distance to a 0-100 similarity percentage score
        int maxLength = Math.max(m, n);
        double similarity = (double) (maxLength - distance) / maxLength;

        return (int) Math.round(similarity * 100);
    }

    private static boolean isNullOrEmpty(String s) {
        return s == null || s.isEmpty();
    }

    public static byte[] convertToWav(byte[] inputBytes) throws IOException, InterruptedException {
        // Write input to a temp file (ffmpeg needs seekable input for WebM)
        Path inputPath = Path.of(System.getProperty("java.io.tmpdir"), UUID.randomUUID() + ".webm");
        Path outputPath = Path.of(System.getProperty("java.io.tmpdir"), UUID.randomUUID() + ".wav");

        try {
            Files.write(inputPath, inputBytes);

            ProcessBuilder pb = new ProcessBuilder(
                    "ffmpeg",
                    "-y",
                    "-i", inputPath.toString(),
                    "-ar", "16000",
                    "-ac", "1",
                    "-c:a", "pcm_s16le",
                    outputPath.toString()
            );
            pb.redirectErrorStream(false);

            Process proc = pb.start();

            String errOutput;
            try (var errStream = proc.getErrorStream()) {
                errOutput = new String(errStream.readAllBytes());
            }

            int exitCode = proc.waitFor();

            if (exitCode != 0) {
                throw new IOException("ffmpeg conversion failed: " + errOutput);
            }

            return Files.readAllBytes(outputPath);
        } finally {
            deleteIfExists(inputPath);
            deleteIfExists(outputPath);
        }
    }

    private static void deleteIfExists(Path path) {
        try {
            File f = path.toFile();
            if (f.exists()) {
                f.delete();
            }
        } catch (Exception ignored) {
            // best-effort cleanup
        }
    }
}