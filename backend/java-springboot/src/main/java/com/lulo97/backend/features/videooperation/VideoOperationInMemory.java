package com.lulo97.backend.features.videooperation;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;

@Component //Allow to be inject everywhere
@ConditionalOnProperty(name = "spring.profiles.active", havingValue = "test", matchIfMissing = true)
public class VideoOperationInMemory implements VideoOperation {
    public VideoOperationInMemory() {
        System.out.println("VideoOperationInMemory run");
    }

    @Override
    public Result<?> WriteThumbnail(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        var video_result = videoRepository.findById(video_id);

        if (video_result.isEmpty())
            return Result.fail("Video not found");

        var video = video_result.get();

        video.setThumbnail(bytes);

        videoRepository.save(video);

        return Result.ok("");
    }

    @Override
    public Result<?> WriteAudio(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        var video_result = videoRepository.findById(video_id);

        if (video_result.isEmpty())
            return Result.fail("Video not found");

        var video = video_result.get();

        video.setAudio_blob_data(bytes);

        videoRepository.save(video);

        return Result.ok("");
    }

    @Override
    public Result<?> WriteVideo(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        var video_result = videoRepository.findById(video_id);

        if (video_result.isEmpty())
            return Result.fail("Video not found");

        var video = video_result.get();

        video.setAudio_blob_data(bytes);

        videoRepository.save(video);

        return Result.ok("");
    }

    @Override
    public Result<byte[]> ReadVideo(Video video) {
        return Result.ok(video.getBlob_data());
    }

    @Override
    public Result<byte[]> ReadThumbnail(Video video) {
        return Result.ok(video.getThumbnail());
    }

    @Override
    public Result<byte[]> ReadAudio(Video video) {
        return Result.ok(video.getAudio_blob_data());
    }

}
