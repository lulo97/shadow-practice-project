package com.lulo97.backend.features.job.ytdlp;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.Utils.TranscriptLineFormat;

@Service
@Transactional
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "test", matchIfMissing = true)
public class FakeYtdlp implements YtdlpService {

    private static final String AssetsPath =
            "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Assets";

    private static final String VideoId = "6hCo4S_1Fhw";

    public boolean HasBuiltInTranscript = true; // toggle in tests


    @Override
    public Result<byte[]> GetThumbnail(String youtubeLink) {
        Path filePath = Path.of(AssetsPath, VideoId + ".jpg");

        if (!Files.exists(filePath))
            return Result.fail("Thumbnail not found at: " + filePath);

        try {
            return Result.ok(Files.readAllBytes(filePath));
        } catch (IOException e) {
            return Result.fail(e.getMessage());
        }
    }


    @Override
    public Result<String> GetTitle(String youtubeLink) {
        return Result.ok("What causes avalanches, and can you survive them? - Simon Trautman");
    }


    @Override
    public Result<String> GetDescription(String youtubeLink) {
        return Result.ok("Explore the three conditions needed to trigger an avalanche, "
                + "and what makes these natural disasters so hard to survive.\r\n");
    }


    @Override
    public Result<byte[]> DownloadVideo(String youtubeLink) {
        Path filePath = Path.of(AssetsPath, VideoId + ".mp4");

        if (!Files.exists(filePath))
            return Result.fail("Video file not found at: " + filePath);

        try {
            return Result.ok(Files.readAllBytes(filePath));
        } catch (IOException e) {
            return Result.fail(e.getMessage());
        }
    }


    @Override
    public Result<List<TranscriptLineFormat>> FetchBuiltInTranscript(String youtubeLink) {

        if (!HasBuiltInTranscript)
            return Result.fail("No built-in transcript available (HasBuiltInTranscript = false).");

        Path filePath = Path.of(AssetsPath, VideoId + ".vtt");

        if (!Files.exists(filePath))
            return Result.fail("Transcript file not found at: " + filePath);

        try {
            String content = Files.readString(filePath);

            return Result.ok(Utils.ParseTranscript(content));

        } catch (IOException e) {
            return Result.fail(e.getMessage());
        }
    }


    @Override
    public Result<byte[]> DownloadAudio(String youtubeLink) {
        Path filePath = Path.of(AssetsPath, VideoId + ".mp3");

        if (!Files.exists(filePath))
            return Result.fail("Audio file not found at: " + filePath);

        try {
            return Result.ok(Files.readAllBytes(filePath));
        } catch (IOException e) {
            return Result.fail(e.getMessage());
        }
    }
}
