package com.lulo97.backend.features.transcriptline;

import java.util.List;

public record TranscriptLineDto(
    Long id,
    Long videoId,
    String text,
    String viText,
    Double start,
    Double end,
    Boolean skip,
    List<RecordDto> records
) {}