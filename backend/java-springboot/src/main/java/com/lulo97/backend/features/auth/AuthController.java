package com.lulo97.backend.features.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.Cookie;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.session.SessionService;
import com.lulo97.backend.features.user.UserService;
import com.lulo97.backend.features.user.Users;

import org.springframework.web.bind.annotation.RequestBody;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpHeaders;
import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final SessionService sessionService;

    public AuthController(UserService userService, SessionService sessionService) {
        this.userService = userService;
        this.sessionService = sessionService;
    }

    @GetMapping("me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        Result<Users> result = AuthComponentHelper.getCurrentUser(request);

        if (!result.getSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", result.getError()));
        }

        Users user = result.getData();

        return ResponseEntity.ok(Map.of("id", user.getId(), "username", user.getUsername(),
                "createdAt", user.getCreatedAt()));
    }

    public record SignUpDto(String username, String password) {
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignUpDto dto) {
        if (dto.username == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username null"));
        }
        if (dto.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password null"));
        }

        var exist_user = this.userService.findByUsername(dto.username);

        if (exist_user.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "User already exist"));
        }

        var password_hashed = AuthUtils.hash(dto.password);
        var new_user = new Users();

        new_user.setUsername(dto.username);
        new_user.setPassword(password_hashed);

        this.userService.create(dto.username, password_hashed);

        return ResponseEntity.ok("Added user id = " + new_user.getId());
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        String token = null;

        if (cookies != null) {
            for (Cookie cookie : cookies) {

                if (cookie.getName().equals(Utils.SESSION_TOKEN)) {
                    token = cookie.getValue();
                    break;
                }

            }
        }

        var session = this.sessionService.findByToken(token);

        if (session.isPresent()) {
            this.sessionService.delete(session.get().getId());
        }

        //Make browser delete cookie
        response.addHeader(HttpHeaders.SET_COOKIE, token);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody SignUpDto dto, HttpServletResponse response) {
        if (dto.username == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Username null"));
        }
        if (dto.password == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password null"));
        }

        var user_result = this.userService.findByUsername(dto.username);

        if (!user_result.isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "User not exist"));
        }

        var user = user_result.get();

        if (!AuthUtils.compareHash(user.getHashedPassword(), dto.password)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Password incorrect"));
        }

        var token = AuthUtils.getToken();

        this.sessionService.create(user.getId(), token);

        ResponseCookie cookie = ResponseCookie.from(Utils.SESSION_TOKEN, token).httpOnly(true)
                .secure(true).path("/").maxAge(Duration.ofHours(1)).sameSite("Strict").build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok("");
    }

}
