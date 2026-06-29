package com.lulo97.backend.features.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lulo97.backend.features.session.SessionService;
import com.lulo97.backend.features.user.UserService;
import com.lulo97.backend.features.user.Users;

import org.springframework.web.bind.annotation.RequestBody;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final SessionService sessionService;
    private String session_token = "session_token";

    public AuthController(UserService userService, SessionService sessionService) {
        this.userService = userService;
        this.sessionService = sessionService;
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

        Optional<Users> result_user = this.userService.findByToken(token);

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
        if (dto.username == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Username null"));
        }
        if (dto.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Password null"));
        }

        var exist_user = this.userService.findByUsername(dto.username);

        if (exist_user.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User already exist"));
        }

        var password_hashed = AuthUtils.hash(dto.password);
        var new_user = new Users();

        new_user.setUsername(dto.username);
        new_user.setPassword(password_hashed);

        this.userService.create(dto.username, password_hashed);

        return ResponseEntity.ok("Added user id = " + new_user.getId());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignUpDto dto, HttpServletResponse response) {
        if (dto.username == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Username null"));
        }
        if (dto.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Password null"));
        }

        var user_result = this.userService.findByUsername(dto.username);

        if (!user_result.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "User not exist"));
        }

        var user = user_result.get();

        if (!AuthUtils.compareHash(user.getHashedPassword(), dto.password)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", "Password incorrect"));
        }

        var token = AuthUtils.getToken();

        this.sessionService.create(user.getId(), token);

        ResponseCookie cookie = ResponseCookie.from(session_token, token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofHours(1))
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("");
    }

}