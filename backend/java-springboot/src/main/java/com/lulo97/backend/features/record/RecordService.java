package com.lulo97.backend.features.record;

import java.util.Optional;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

@Service
@Transactional
public class RecordService {
    private final RecordRepository recordRepository;

    RecordService(RecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    public Record save(Record record) {
        return this.recordRepository.save(record);
    }

    public Optional<Record> findById(Long record_id) {
        return this.recordRepository.findById(record_id);
    }

    public Object getRecordsFromTranscriptLineId(Long transcript_line_id) {
        return this.recordRepository.getRecordsFromTranscriptLineId(transcript_line_id);
    }
}
