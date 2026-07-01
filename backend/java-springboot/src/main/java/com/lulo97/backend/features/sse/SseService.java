package com.lulo97.backend.features.sse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
public class SseService {

    // userId -> list of active emitters (one user can have multiple tabs/devices)
    private final Map<Long, List<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    /** Register a new connection for a given user. */
    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(0L);

        userEmitters.computeIfAbsent(userId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((e) -> removeEmitter(userId, emitter));

        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            System.err.println(e);
            removeEmitter(userId, emitter);
        }

        return emitter;
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        List<SseEmitter> list = userEmitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                userEmitters.remove(userId);
            }
        }
    }

    /** Broadcast to everyone. */
    public void sendToFrontEnd(String jsonPayload) {
        userEmitters.keySet().forEach(userId -> sendToUser(jsonPayload, userId));
    }

    /**
     * Send to a specific user only.
     * Usage: sseService.sendToFrontEnd("hello", 1L);
     */
    public void sendToUser(String jsonPayload, Long userId) {
        List<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return; // user not connected, nothing to do
        }

        List<SseEmitter> dead = new CopyOnWriteArrayList<>();
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("message")
                        .data(jsonPayload, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException e) {
                System.err.println(e);
                dead.add(emitter);
            }
        }
        emitters.removeAll(dead);
    }

    // Overload matching your requested signature: sendToFrontEnd("hello", 1)
    public void sendToFrontEnd(String jsonPayload, Long userId) {
        sendToUser(jsonPayload, userId);
    }
}