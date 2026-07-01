package com.lulo97.backend.features.job.ytdlp;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lulo97.backend.Result;
import com.lulo97.backend.Utils.TranscriptLineFormat;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod", matchIfMissing = true)
public class YtdlpCLI implements YtdlpService {

    @Override
    public Result<String> GetTitle(String youtubeLink) {
        return run(new String[] {"--print", "title"}, youtubeLink);
    }

    @Override
    public Result<String> GetDescription(String youtubeLink) {
        return run(new String[] {"--print", "description"}, youtubeLink);
    }

    @Override
    public Result<byte[]> GetThumbnail(String youtubeLink) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory(UUID.randomUUID().toString());
            String outputTemplate = tempDir.resolve("thumb.%(ext)s").toString();

            Result<String> run = run(new String[] {"--write-thumbnail", "--skip-download",
                    "--convert-thumbnails", "jpg", "-o", outputTemplate, "--no-playlist"},
                    youtubeLink);

            if (!run.getSuccess())
                return Result.fail(run.getError());

            File thumbnailFile = tempDir.resolve("thumb.jpg").toFile();
            if (!thumbnailFile.exists())
                return Result.fail("Thumbnail file was not created after download.");

            return Result.ok(Files.readAllBytes(thumbnailFile.toPath()));
        } catch (Exception ex) {
            return Result.fail("Unexpected error: " + ex.getMessage());
        } finally {
            deleteDirectoryRecursively(tempDir);
        }
    }

    @Override
    public Result<byte[]> DownloadVideo(String youtubeLink) {
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile(UUID.randomUUID().toString(), ".mp4");

            Result<String> run = run(new String[] {"-f",
                    "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]",
                    "-o", tempFile.toString(), "--no-playlist"}, youtubeLink);

            if (!run.getSuccess())
                return Result.fail(run.getError());

            if (!Files.exists(tempFile) || Files.size(tempFile) == 0)
                return Result.fail("Video file was not created after download.");

            return Result.ok(Files.readAllBytes(tempFile));
        } catch (Exception ex) {
            return Result.fail("Unexpected error: " + ex.getMessage());
        } finally {
            deleteFile(tempFile);
        }
    }

    @Override
    public Result<List<TranscriptLineFormat>> FetchBuiltInTranscript(String youtubeLink) {
        Path tempDir = null;
        try {
            tempDir = Files.createTempDirectory(UUID.randomUUID().toString());
            String outputTemplate = tempDir.resolve("sub").toString();

            Result<String> run = run(new String[] {"--skip-download", "--write-subs", "--sub-lang",
                    "en", "--sub-format", "vtt", "-o", outputTemplate}, youtubeLink);

            if (!run.getSuccess())
                return Result.fail(run.getError());

            File vttFile = findFirstMatching(tempDir, ".vtt");
            if (vttFile == null)
                return Result.fail("No built-in English subtitles found for this video.");

            String raw = Files.readString(vttFile.toPath(), StandardCharsets.UTF_8);
            return Result.ok(parseTranscript(raw));
        } catch (Exception ex) {
            return Result.fail("Unexpected error: " + ex.getMessage());
        } finally {
            deleteDirectoryRecursively(tempDir);
        }
    }

    @Override
    public Result<byte[]> DownloadAudio(String youtubeLink) {
        Path tempFile = null;
        try {
            tempFile = Files.createTempFile(UUID.randomUUID().toString(), ".mp3");

            Result<String> run = run(new String[] {"-f", "bestaudio", "-x", "--audio-format", "mp3",
                    "-o", tempFile.toString(), "--no-playlist"}, youtubeLink);

            if (!run.getSuccess())
                return Result.fail(run.getError());

            if (!Files.exists(tempFile) || Files.size(tempFile) == 0)
                return Result.fail("Audio file was not created after download.");

            return Result.ok(Files.readAllBytes(tempFile));
        } catch (Exception ex) {
            return Result.fail("Unexpected error: " + ex.getMessage());
        } finally {
            deleteFile(tempFile);
        }
    }

    // Runs yt-dlp with the given arguments (plus an optional URL) and returns
    // a Result<String> wrapping stdout, mirroring the C# RunAsync helper.
    private Result<String> run(String[] arguments, String url) {
        List<String> command = new ArrayList<>();
        command.add("yt-dlp");
        for (String arg : arguments)
            command.add(arg);
        if (url != null)
            command.add(url);

        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(false);
            Process process = pb.start();

            String stdout = readStream(process.getInputStream());
            String stderr = readStream(process.getErrorStream());

            int exitCode = process.waitFor();

            if (exitCode != 0)
                return Result.fail("yt-dlp failed (exit " + exitCode + "): " + stderr.trim());

            return Result.ok(stdout);
        } catch (IOException | InterruptedException ex) {
            if (ex instanceof InterruptedException)
                Thread.currentThread().interrupt();
            return Result.fail("Unexpected error: " + ex.getMessage());
        }
    }

    private String readStream(java.io.InputStream inputStream) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader =
                new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append(System.lineSeparator());
            }
        }
        return sb.toString();
    }

    private File findFirstMatching(Path dir, String suffix) throws IOException {
        try (Stream<Path> files = Files.list(dir)) {
            return files.filter(p -> p.getFileName().toString().endsWith(suffix)).map(Path::toFile)
                    .findFirst().orElse(null);
        }
    }

    private void deleteFile(Path file) {
        if (file == null)
            return;
        try {
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
        }
    }

    private void deleteDirectoryRecursively(Path dir) {
        if (dir == null || !Files.exists(dir))
            return;
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted((a, b) -> b.compareTo(a)).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            });
        } catch (IOException ignored) {
        }
    }

    // Basic WebVTT parser producing TranscriptLineFormat entries with
    // start time, end time and text, skipping headers/cues metadata.
    private static final Pattern TIME_PATTERN = Pattern
            .compile("(\\d{2}:\\d{2}:\\d{2}[.,]\\d{3})\\s*-->\\s*(\\d{2}:\\d{2}:\\d{2}[.,]\\d{3})");

    private List<TranscriptLineFormat> parseTranscript(String raw) {
        List<TranscriptLineFormat> lines = new ArrayList<>();
        String[] rawLines = raw.replace("\r\n", "\n").split("\n");

        Double currentStart = null;
        Double currentEnd = null;
        StringBuilder textBuilder = new StringBuilder();

        for (String line : rawLines) {
            Matcher matcher = TIME_PATTERN.matcher(line);
            if (matcher.find()) {
                // flush previous cue
                if (currentStart != null && textBuilder.length() > 0) {
                    lines.add(new TranscriptLineFormat(currentStart, currentEnd,
                            textBuilder.toString().trim()));
                }
                currentStart = Double.parseDouble(matcher.group(1));
                currentEnd = Double.parseDouble(matcher.group(2));
                textBuilder = new StringBuilder();
            } else if (line.isBlank() || line.equals("WEBVTT") || line.matches("^\\d+$")) {
                // skip header/index/blank lines
            } else if (currentStart != null) {
                String cleaned = line.replaceAll("<[^>]*>", "").trim();
                if (!cleaned.isEmpty()) {
                    if (textBuilder.length() > 0)
                        textBuilder.append(" ");
                    textBuilder.append(cleaned);
                }
            }
        }

        if (currentStart != null && textBuilder.length() > 0) {
            lines.add(new TranscriptLineFormat(currentStart, currentEnd,
                    textBuilder.toString().trim()));
        }

        return lines;
    }
}
