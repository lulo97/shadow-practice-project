package com.lulo97.backend.features.transcriptline;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TranscriptLineRepository extends JpaRepository<TranscriptLine, Long> {
    @Query(value = """
        SELECT 
            tl.*,
            r.* 
        FROM transcript_lines tl 
        LEFT JOIN records r ON r.transcript_line_id = tl.id 
        WHERE tl.video_id = :videoId
        """, nativeQuery = true)
    List<Object[]> findByVideoIdWithRecords(@Param("videoId") Long video_id);
}
