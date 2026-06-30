package com.lulo97.backend.features.record;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import com.lulo97.backend.features.recordoperation.RecordOperation;
import com.lulo97.backend.features.stt.SttFactory;
import com.lulo97.backend.features.stt.SttUtils;
import com.lulo97.backend.features.transcriptline.TranscriptLineService;
import com.lulo97.backend.features.user.Users;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/records")
public class RecordController {
    private final RecordRepository recordRepository;
    private final RecordService recordService;
    private final RecordOperation recordOperation;
    private final TranscriptLineService transcriptLineService;
    private final SttFactory sttFactory;

    public RecordController(RecordService recordService, RecordOperation recordOperation,
            TranscriptLineService transcriptLineService, SttFactory sttFactory,
            RecordRepository recordRepository) {
        this.recordOperation = recordOperation;
        this.recordService = recordService;
        this.transcriptLineService = transcriptLineService;
        this.sttFactory = sttFactory;
        this.recordRepository = recordRepository;
    }

    public record CreateRecordDto(@NotNull(message = "File is required") MultipartFile file,
            @NotNull(message = "VideoId is required") Long videoId,
            @NotNull(message = "TranscriptLineId is required") Long transcriptLineId) {
    }

    @PostMapping("path")
    public ResponseEntity<?> add(@RequestBody CreateRecordDto body, HttpServletRequest request) {
        var transcriptLineOptinal = this.transcriptLineService.findById(body.transcriptLineId);

        if (transcriptLineOptinal.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Transcript null"));

        }

        if (transcriptLineOptinal.get().getSkip() == 1) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Skipped line can't be record"));
        }

        byte[] bytes = null;
        try {
            bytes = body.file.getBytes();
        } catch (IOException e) {
            System.err.println(e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "File invalid"));
        }

        if (bytes == null || bytes.length < 1024) {
            String dummyPath =
                    "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Assets\\dummy.wav";

            File dummyFile = new File(dummyPath);

            if (dummyFile.exists()) {
                try {
                    bytes = Files.readAllBytes(dummyFile.toPath());
                } catch (IOException e) {
                    System.err.println(e);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("message", "Failed to read dummy file"));
                }
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message",
                        "Uploaded file is invalid, and system dummy file was not found."));
            }
        }

        var result_setting = AuthComponentHelper.getCurrentSetting(request);

        if (!result_setting.getSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", result_setting.getError()));
        }

        var stt = this.sttFactory.getSTT(result_setting.getData());

        var sttText = stt.Run(bytes);

        var new_record = new Record();
        new_record.setSttProviderKey(stt.GetKey());
        new_record.setVideoId(transcriptLineOptinal.get().getVideoId());
        new_record.setTranscriptLineId(transcriptLineOptinal.get().getId());
        new_record.setSttText(sttText);
        new_record.setScore(SttUtils.getScore(transcriptLineOptinal.get().getText(), sttText));
        new_record.setUserId(result_setting.getData().getUserId());
        var saved_record = this.recordService.save(new_record);

        var writer_result =
                this.recordOperation.WriteAudio(saved_record.getId(), recordRepository, bytes);

        if (!writer_result.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", writer_result.getError()));
        }

        return ResponseEntity.ok("");
    }

}
