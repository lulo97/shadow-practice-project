package com.lulo97.backend.features.recordoperation;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.record.Record;
import com.lulo97.backend.features.record.RecordRepository;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;

public interface RecordOperation {
    Result<Record> WriteAudio(Long record_id, RecordRepository recordRepository, byte[] bytes);

    Result<byte[]> ReadAudio(Record record);
}
