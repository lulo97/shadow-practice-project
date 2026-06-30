package com.lulo97.backend.features.recordoperation;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.record.Record;
import com.lulo97.backend.features.record.RecordRepository;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;

@Component // Allow to be inject everywhere
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "test", matchIfMissing = true)
public class RecordOperationInMemory implements RecordOperation {
    public RecordOperationInMemory() {
        System.out.println("RecordOperationInMemory run");
    }

    @Override
    public Result<?> WriteAudio(Long record_id, RecordRepository recordRepository, byte[] bytes) {
        var result = recordRepository.findById(record_id);

        if (result.isEmpty())
            return Result.fail("Record not found");

        var record = result.get();

        record.setBlobData(bytes);

        recordRepository.save(record);

        return Result.ok("");
    }

    @Override
    public Result<byte[]> ReadAudio(Record record) {
        return Result.ok(record.getBlobData());
    }

}
