package com.lulo97.backend.features.transcriptline;

import java.util.List;
import java.util.Optional;
import jakarta.validation.constraints.NotNull;

public interface TranscriptLineService {
    List<TranscriptLineDto> findByVideoIdWithRecords(Long videoId);

    Optional<TranscriptLine> findById(Long transcriptLineId);

    TranscriptLine save(TranscriptLine transcript);

    List<TranscriptLine> saveAll(List<TranscriptLine> updatedLines);

    List<TranscriptLine> findByVideoId(Long videoId);
}
