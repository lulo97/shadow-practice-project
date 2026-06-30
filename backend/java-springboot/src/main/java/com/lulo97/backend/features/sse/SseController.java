package com.lulo97.backend.features.sse;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/sse")
public class SseController {

    private final SseService sseService;

    public SseController(SseService sseService) {
        this.sseService = sseService;
    }

    @GetMapping(path = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(HttpServletRequest request) {
        var user = AuthComponentHelper.getCurrentUser(request);

        if (!user.getSuccess()) {
            throw new RuntimeException(user.getError());
        }

        return sseService.subscribe(user.getData().getId());
    }
}
