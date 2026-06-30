package com.lulo97.backend.features.record;

public class RecordService {
    private final RecordRepository recordRepository;

    RecordService(RecordRepository recordRepository) {
        this.recordRepository = recordRepository;
    }

    public Record save(Record record) {
        return this.recordRepository.save(record);
    }
}
