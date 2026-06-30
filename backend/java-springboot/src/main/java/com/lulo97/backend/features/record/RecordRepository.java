package com.lulo97.backend.features.record;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RecordRepository extends JpaRepository<Record, Long> {

    @Query("""
            select r from Record r where r.transcriptLineId = :transcriptLineId
            """)
    List<Record> getRecordsFromTranscriptLineId(@Param("transcriptLineId") Long transcript_line_id);

}
