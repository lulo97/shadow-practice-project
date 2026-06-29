package com.lulo97.backend.features.auth;

import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.user.UserService;
import com.lulo97.backend.features.user.Users;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class AuthComponentHelper {

    private static UserService userService;

    public AuthComponentHelper(UserService userService) {
        AuthComponentHelper.userService = userService;
    }

    public static Result<Users> getCurrentUser(HttpServletRequest request) {

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

        if (token == null) {
            return Result.fail("Token is null");
        }

        return userService.findByToken(token);
    }
}