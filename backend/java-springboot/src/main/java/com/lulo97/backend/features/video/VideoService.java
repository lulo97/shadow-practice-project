package com.lulo97.backend.features.video;

import java.time.LocalDateTime;

import com.lulo97.backend.Result;

public interface VideoService {
    Result<?> getList(Long user_id, String title, LocalDateTime fromDate, LocalDateTime toDate, String videoType);
}
