package com.lulo97.backend.features.video;

import java.time.LocalDateTime;
import java.util.Optional;

import com.lulo97.backend.Result;

public interface VideoService {
    Result<?> getList(Long user_id, String title, LocalDateTime fromDate, LocalDateTime toDate, String videoType);
    Optional<Video> findById(Long id);
    Video save(Video video);
}
