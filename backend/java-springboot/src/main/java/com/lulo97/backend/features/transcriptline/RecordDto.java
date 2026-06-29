package com.lulo97.backend.features.transcriptline;

import java.time.LocalDateTime;

public record RecordDto(
    Long id,
    String sttText,
    Double score,
    String sttProviderKey,
    LocalDateTime createdAt
) {}