package com.lulo97.backend.features.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final IUserRepository userRepository;
    private String session_token = "session_token";

    public AuthController(IUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("me")
    public ResponseEntity<?> Me(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        String token;

        if (cookies != null) {
            for (Cookie cookie: cookies) {
                if (cookie.getName() == session_token) {
                    token = cookie.getValue();
                }
            }
        }

        Optional<Users> result_user = this.userRepository.findByToken(token);

        if (result_user.isEmpty()) {
            throw new RuntimeException("123");
        }

        Users user = result_user.get();

        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "username", user.username,
            "createdAt", user.created_at
        })
    }
    

    @GetMapping("/login")
    public Map<String, String> getHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("message", "ok");
        return status;

    }

}