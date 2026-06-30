package com.lulo97.backend.features.auth;

import org.springframework.stereotype.Component;

import com.lulo97.backend.Result;
import com.lulo97.backend.Utils;
import com.lulo97.backend.features.user.UserService;
import com.lulo97.backend.features.user.Users;
import com.lulo97.backend.features.usersetting.UserSetting;
import com.lulo97.backend.features.usersetting.UserSettingService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

@Component
public class AuthComponentHelper {

    private static UserService userService;
    private static UserSettingService userSettingService;

    public AuthComponentHelper(UserService userService, UserSettingService userSettingService) {
        AuthComponentHelper.userService = userService;
        AuthComponentHelper.userSettingService = userSettingService;
    }

    public static Result<UserSetting> getCurrentSetting(HttpServletRequest request) {
        var result_user = getCurrentUser(request);

        if (!result_user.getSuccess())
            return Result.fail(result_user.getError());

        var result_setting = userSettingService.getByUserId(result_user.getData().getId());

        if (!result_setting.isEmpty()) {
            return Result.ok(new UserSetting(result_user.getData().getId(), "WHISPER_CPP", 0, 30));
        }

        return Result.ok(result_setting.get());
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
