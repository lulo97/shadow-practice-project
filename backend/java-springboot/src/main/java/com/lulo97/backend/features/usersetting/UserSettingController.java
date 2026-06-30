package com.lulo97.backend.features.usersetting;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import com.lulo97.backend.features.user.Users;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("api/usersettings")
public class UserSettingController {

    private final UserSettingService userSettingService;

    public UserSettingController(UserSettingService userSettingService) {
        this.userSettingService = userSettingService;
    }

    @GetMapping()
    public ResponseEntity<?> get(HttpServletRequest request) {
        Result<Users> result_user = AuthComponentHelper.getCurrentUser(request);

        if (!result_user.getSuccess()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", result_user.getError()));
        }

        Optional<UserSetting> us = this.userSettingService.getByUserId(result_user.getData().getId());

        UserSetting output_us = null;
        if (us.isEmpty()) {
            output_us = this.userSettingService
                    .save(new UserSetting(result_user.getData().getId(), "WHISPER_CPP", 0, 30));
        } else {
            output_us = us.get();
        }

        return ResponseEntity.ok(output_us);
    }
}
