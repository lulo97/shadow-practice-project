package com.lulo97.backend.features.transcriptline;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transcripts")
public class TranscriptLineController {
    private final TranscriptLineService transcriptLineService;

    public TranscriptLineController(TranscriptLineService transcriptLineService) {
        this.transcriptLineService = transcriptLineService;
    }

    @GetMapping("{video_id}")
    public ResponseEntity<?> getList(@PathVariable Long video_id) {
        var result = transcriptLineService.findByVideoIdWithRecords(video_id);
        return ResponseEntity.ok(result);
    }
}
