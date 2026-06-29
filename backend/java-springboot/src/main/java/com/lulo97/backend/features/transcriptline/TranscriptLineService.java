package com.lulo97.backend.features.transcriptline;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.repository.query.Param;

public interface TranscriptLineService {
    List<TranscriptLineDto> findByVideoIdWithRecords(Long videoId);
}