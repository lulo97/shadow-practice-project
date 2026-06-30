package com.lulo97.backend.features.transcriptline;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TranscriptLineRepository extends JpaRepository<TranscriptLine, Long> {
}
