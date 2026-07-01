package com.lulo97.backend.features.videooperation;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.function.BiConsumer;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.video.Video;
import com.lulo97.backend.features.video.VideoRepository;

@ConditionalOnProperty(
    name = "spring.profiles.active", 
    havingValue = "prod",
    matchIfMissing = true
)
@Component
public class VideoOperationLocalFile implements VideoOperation {

    public VideoOperationLocalFile() {
        System.out.println("VideoOperationLocalFile run");
    }

    @Override
    public Result<?> WriteThumbnail(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        return writeFile(video_id, videoRepository, bytes, Video::setThumbnail_file_name, ".jpg");
    }

    @Override
    public Result<?> WriteAudio(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        return writeFile(video_id, videoRepository, bytes, Video::setAudio_filename, ".mp3");
    }

    @Override
    public Result<?> WriteVideo(Long video_id, VideoRepository videoRepository, byte[] bytes) {
        return writeFile(video_id, videoRepository, bytes, Video::setFilename, ".mp4");
    }

    @Override
    public Result<byte[]> ReadVideo(Video video) {
        return readFile(video.getFilename());
    }

    @Override
    public Result<byte[]> ReadThumbnail(Video video) {
        return readFile(video.getThumbnail_file_name());
    }

    @Override
    public Result<byte[]> ReadAudio(Video video) {
        return readFile(video.getAudio_filename());
    }

    // --- Helpers ---

    private Result<?> writeFile(Long video_id, VideoRepository videoRepository, byte[] bytes,
            BiConsumer<Video, String> fileNameSetter, String ext) {
        var video_result = videoRepository.findById(video_id);

        if (video_result.isEmpty())
            return Result.fail("Video not found");

        var video = video_result.get();
        Path filePath = Paths.get(Utils.LOCAL_FILE_PATH, video.getYoutube_id() + ext);
        System.out.println("Writing to: " + filePath.toAbsolutePath());
        try {
            Files.createDirectories(filePath.getParent());
            String fileNameCreated = Files.write(filePath, bytes).getFileName().toString();
            fileNameSetter.accept(video, fileNameCreated);
            videoRepository.save(video);
        } catch (IOException e) {
            System.out.println(e);
            return Result.fail(e.getMessage());
        }

        return Result.ok("");
    }

    private Result<byte[]> readFile(String fileName) {
        if (fileName == null || fileName.length() == 0) {
            return Result.ok(null);
        }

        Path filePath = Paths.get(Utils.LOCAL_FILE_PATH, fileName);

        try {
            return Result.ok(Files.readAllBytes(filePath));
        } catch (IOException e) {
            System.out.println(e);
            return Result.fail(e.getMessage());
        }
    }
}