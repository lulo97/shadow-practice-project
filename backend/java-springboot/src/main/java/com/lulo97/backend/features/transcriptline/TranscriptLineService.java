package com.lulo97.backend.features.transcriptline;

import java.util.List;

public interface TranscriptLineService {
    List<TranscriptLineDto> findByVideoIdWithRecords(Long videoId);
}