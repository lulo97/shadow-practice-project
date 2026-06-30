package com.lulo97.backend.features.transcriptline;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.lulo97.backend.Result;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/transcripts")
public class TranscriptLineController {
    private final TranscriptLineService transcriptLineService;

    public TranscriptLineController(TranscriptLineService transcriptLineService) {
        this.transcriptLineService = transcriptLineService;
    }

    public record TranslateRequest(String ViText) {
    }

    @PostMapping("/translate/{video_id}")
    public ResponseEntity<?> translate(@PathVariable("video_id") Long videoId,
            @RequestBody TranslateRequest request) {

        List<String> parsed = TranscriptUtils.parseViText(request.ViText);
        Result<Boolean> validation = TranscriptUtils.validateViText(request.ViText);

        if (!validation.getSuccess()) {
            return ResponseEntity.badRequest().body(Map.of("message", validation.getError()));
        }

        return updateViTextAsync(videoId, parsed, "Saved");
    }

    private ResponseEntity<?> updateViTextAsync(Long videoId, List<String> parsedViText,
            String actionName) {

        List<TranscriptLineDto> transcriptLines =
                this.transcriptLineService.findByVideoIdWithRecords(videoId);

        if (transcriptLines.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "No transcript lines found for video " + videoId));
        }

        if (parsedViText.size() != transcriptLines.size()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message",
                            String.format("Line count mismatch: got %d lines but video has %d.",
                                    parsedViText.size(), transcriptLines.size())));
        }

        List<TranscriptLine> updatedLines = new ArrayList<>();
        for (int i = 0; i < transcriptLines.size(); i++) {
            var currentLineOptinal =
                    this.transcriptLineService.findById(transcriptLines.get(i).id());
            var currentLine = currentLineOptinal.get();
            currentLine.setViText((parsedViText.get(i)));
            updatedLines.add(currentLine);
        }

        this.transcriptLineService.saveAll(updatedLines);

        return ResponseEntity
                .ok(Map.of("message", actionName + " " + parsedViText.size() + " vi text lines"));
    }


    @PostMapping("skip/{transcript_line_id}")
    public ResponseEntity<?> skip(@PathVariable Long transcript_line_id) {
        var result_transcript_line = this.transcriptLineService.findById(transcript_line_id);

        if (result_transcript_line.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Transcript not exist"));
        }

        var transcript = result_transcript_line.get();

        transcript.setSkip(transcript.getSkip() == 0 ? 1 : 0);

        this.transcriptLineService.save(transcript);

        return ResponseEntity.ok("");
    }


    @GetMapping("{video_id}")
    public ResponseEntity<?> getList(@PathVariable Long video_id) {
        var result = transcriptLineService.findByVideoIdWithRecords(video_id);
        return ResponseEntity.ok(result);
    }
}
