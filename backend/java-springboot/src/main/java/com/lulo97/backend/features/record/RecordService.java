package com.lulo97.backend.features.record;

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
}
