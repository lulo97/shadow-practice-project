package com.lulo97.backend.features.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lulo97.backend.features.user.UserRepository;
import com.lulo97.backend.features.user.Users;

import org.springframework.web.bind.annotation.RequestBody;
//import io.swagger.v3.oas.annotations.parameters.RequestBody; --> This cause body can't be parse
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.web.bind.annotation.RequestParam;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private String session_token = "session_token";

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        String token = null;

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName() == session_token) {
                    token = cookie.getValue();
                }
            }
        }

        if (token == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token is null"));
        }

        Optional<Users> result_user = this.userRepository.findByToken(token);

        if (result_user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "User not found"));
        }

        Users user = result_user.get();

        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "createdAt", user.getCreatedAt()));
    }

    public record SignUpDto(
            String username,
            String password) {
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignUpDto dto) {
        var exist_user = this.userRepository.findByUsername(dto.username);

        if (exist_user.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User already exist"));
        }

        var password_hashed = dto.password;
        var new_user = new Users();

        new_user.setUsername(dto.username);
        new_user.setPassword(password_hashed);

        this.userRepository.save(new_user);

        return ResponseEntity.ok("");
    }

    // @PostMapping("/login")
    // public ResponseEntity<?> login() {
    // Map<String, String> status = new HashMap<>();
    // status.put("message", "ok");
    // return status;
    // }

}