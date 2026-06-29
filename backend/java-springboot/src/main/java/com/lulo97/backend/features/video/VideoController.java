package com.lulo97.backend.features.video;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import com.lulo97.backend.features.user.Users;
import com.lulo97.backend.features.videooperation.VideoOperation;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/videos")
public class VideoController {

    private final VideoService videoService;
    private final VideoOperation videoOperation;

    public VideoController(VideoService videoService, VideoOperation videoOperation) {
        this.videoService = videoService;
        this.videoOperation = videoOperation;
    }

    @GetMapping("")
    public ResponseEntity<?> getList(HttpServletRequest request,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDateTime toDate,
            @RequestParam(required = false) String videoType

    ) {
        Result<Users> result = AuthComponentHelper.getCurrentUser(request);

        if (!result.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result.getError()));
        }

        Users user = result.getData();

        var results = videoService.getList(user.getId(), title, fromDate, toDate, videoType);

        if (!results.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result.getError()));
        }

        return ResponseEntity.ok(results.getData());
    }

    @GetMapping("thumbnail/{video_id}")
    public ResponseEntity<?> getThumbnail(@PathVariable Long video_id) {
        var video = this.videoService.findById(video_id);

        if (video.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Video not exist"));
        }

        var result = this.videoOperation.ReadThumbnail(video.get());

        if (!result.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result.getError()));
        }

        return ResponseEntity.ok(result.getData());
    }
}
