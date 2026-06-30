package com.lulo97.backend.features.job;

import com.lulo97.backend.features.video.VideoRepository;
import com.lulo97.backend.features.video.VideoService;

import java.io.IOException;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    @PostMapping("video")
    public ResponseEntity<?> video(HttpServletRequest request) throws IOException {
        String raw_body =
                request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

        ObjectMapper mapper = new ObjectMapper();

        JsonNode json = mapper.readTree(raw_body);

        String youtubeLink = json.get("YoutubeLink").asText();

        if (youtubeLink == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Youtube link null, got " + raw_body));
        }
        var result_valid = Utils.isYoutubeIdValid(youtubeLink);
        if (!result_valid.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", result_valid.getError()));
        }
        var result_ytb_id = Utils.getYoutubeId(youtubeLink);

        Result<Users> result_user = AuthComponentHelper.getCurrentUser(request);

        if (!result_user.getSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", result_user.getError()));
        }

        Users user = result_user.getData();

        var newVideo = new Video();
        newVideo.setUser_id(user.getId());
        newVideo.setYoutube_id(result_ytb_id);
        this.videoService.save(newVideo);

        var newJob = new Job();
        newJob.setUserId(user.getId());
        newJob.setVideoId(newVideo.getId());
        newJob.setType(JobType.VIDEO_INGEST);
        newJob.setStatus(JobStatus.QUEUED);

        this.jobService.save(newJob);

        return ResponseEntity.ok("");
    }
}
