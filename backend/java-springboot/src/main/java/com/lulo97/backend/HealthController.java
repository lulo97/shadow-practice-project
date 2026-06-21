package com.lulo97.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/v1")
public class HealthController {

    @GetMapping("/health")
    public Map<String, String> getHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("message", "ok");
        return status;

    }

}