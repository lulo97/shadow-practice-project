package com.lulo97.backend.features.videooperation;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;

public interface VideoOperation {
    Result<?> WriteThumbnail(Long video_id, VideoRepository videoRepository, byte[] bytes);
    Result<?> WriteAudio(Long video_id, VideoRepository videoRepository, byte[] bytes);
    Result<?> WriteVideo(Long video_id, VideoRepository videoRepository, byte[] bytes);
    Result<byte[]> ReadVideo(Video video);
    Result<byte[]> ReadThumbnail(Video video);
    Result<byte[]> ReadAudio(Video video);
}
