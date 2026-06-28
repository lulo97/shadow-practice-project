package com.lulo97.backend.features.auth;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @GetMapping("/login")
    public Map<String, String> getHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("message", "ok");
        return status;

    }

}