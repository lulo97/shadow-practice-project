package com.lulo97.backend.features.job;

import com.lulo97.backend.features.video.VideoRepository;
import com.lulo97.backend.features.video.VideoService;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import com.lulo97.backend.features.user.Users;
import com.lulo97.backend.features.video.Video;

import io.swagger.v3.oas.annotations.parameters.RequestBody;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/job")
public class JobController {
    private final VideoService videoService;
    private final JobService jobService;

    JobController(VideoService videoService, JobService jobService) {
        this.videoService = videoService;
        this.jobService = jobService;
    }

    public record JobVideoBody(
            String youtubeId) {
    }

    @PostMapping("video")
    public ResponseEntity<?> video(HttpServletRequest request, @RequestBody JobVideoBody body) {
        if (body.youtubeId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Youtube id null"));
        }
        var result_valid = Utils.isYoutubeIdValid(body.youtubeId);
        if (result_valid.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result_valid.getError()));
        }
        Result<Users> result_user = AuthComponentHelper.getCurrentUser(request);

        if (!result_user.getSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", result_user.getError()));
        }

        Users user = result_user.getData();

        var newVideo = new Video();
        newVideo.setUser_id(user.getId());
        newVideo.setYoutube_id(body.youtubeId);
        this.videoService.save(newVideo);

        var newJob = new Job();
        newJob.setUserId(user.getId());
        newJob.setVideoId(Long.parseLong(body.youtubeId));
        newJob.setType(JobType.VIDEO_INGEST);
        newJob.setStatus(JobStatus.QUEUED);

        this.jobService.save(newJob);

        return ResponseEntity.ok("");
    }
}