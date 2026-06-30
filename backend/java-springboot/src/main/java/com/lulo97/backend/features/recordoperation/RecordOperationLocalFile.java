package com.lulo97.backend.features.recordoperation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.record.Record;
import com.lulo97.backend.features.record.RecordRepository;

@Component // Allow to be inject everywhere
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "prod", matchIfMissing = true)
public class RecordOperationLocalFile implements RecordOperation {
    public RecordOperationLocalFile() {
        System.out.println("RecordOperationLocalFile run");
    }

    @Override
    public Result<Record> WriteAudio(Long record_id, RecordRepository recordRepository,
            byte[] bytes) {
        var result = recordRepository.findById(record_id);

        if (result.isEmpty())
            return Result.fail("Record not found");

        var record = result.get();

        record.setBlobData(bytes);

        Path filePath = Paths.get(Utils.LOCAL_FILE_PATH, UUID.randomUUID().toString() + ".wav");

        try {
            String fileNameCreated = Files.write(filePath, bytes).getFileName().toString();
            record.setFilePath(fileNameCreated);
            recordRepository.save(record);
        } catch (IOException e) {
            System.out.println(e);
            return Result.fail(e.getMessage());
        }

        var added_result = recordRepository.findById(record_id);

        return Result.ok(added_result.get());
    }

    @Override
    public Result<byte[]> ReadAudio(Record record) {
        Path filePath = Paths.get(Utils.LOCAL_FILE_PATH, record.getFilePath());

        try {
            return Result.ok(Files.readAllBytes(filePath));
        } catch (IOException e) {
            System.out.println(e);
            return Result.fail(e.getMessage());
        }
    }
}
