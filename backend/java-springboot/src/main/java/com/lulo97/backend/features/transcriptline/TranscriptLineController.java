package com.lulo97.backend.features.transcriptline;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api/transcripts")
public class TranscriptLineController {
    private final TranscriptLineService transcriptLineService;

    public TranscriptLineController(TranscriptLineService transcriptLineService) {
        this.transcriptLineService = transcriptLineService;
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
