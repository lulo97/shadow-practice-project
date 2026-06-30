package com.lulo97.backend.features.usersetting;

import java.util.List;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.lang.reflect.Field;

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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", result_user.getError()));
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

    public class SettingDatasource {

        private List<String> sttProviders = List.of("WHISPER_CPP", "PARAKEET");
        private List<Integer> loopOptions = List.of(0, 1);

        public List<String> getSttProviders() {
            return sttProviders;
        }

        public void setSttProviders(List<String> sttProviders) {
            this.sttProviders = sttProviders;
        }

        public List<Integer> getLoopOptions() {
            return loopOptions;
        }

        public void setLoopOptions(List<Integer> loopOptions) {
            this.loopOptions = loopOptions;
        }
    }

    @GetMapping("datasource")
    public ResponseEntity<?> datasource() {
        return ResponseEntity.ok(new SettingDatasource());
    }

    public record UpdatePropertyBody(
            String key,
            String value) {
    }

    // {
    // "sttProviderKey": "WHISPER_CPP",
    // "loop": 0,
    // "videoWidthSize": 56.293558606124606,
    // "id": 1584011180752795,
    // "userId": 6576150950792860
    // }
    public record SaveBody(
            String sttProviderKey,
            Integer loop,
            Double videoWidthSize,
            Long id,
            Long userId) {
    }

    @PostMapping()
    public ResponseEntity<?> save(@RequestBody SaveBody request_body) {
        var result_us = this.userSettingService.findById(request_body.id);

        if (result_us.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "User setting not found"));
        }

        UserSetting us_out = result_us.get();

        us_out.setLoop(request_body.loop);
        us_out.setSttProviderKey(request_body.sttProviderKey);
        us_out.setVideoWidthSize(request_body.videoWidthSize);

        this.userSettingService.save(us_out);

        return ResponseEntity.ok("");
    }

    @PostMapping("update-property")
    public ResponseEntity<?> updateProperty(HttpServletRequest request,
            @RequestBody UpdatePropertyBody request_body)
            throws NoSuchFieldException, SecurityException, IllegalArgumentException, IllegalAccessException {

        if (request == null || request_body == null || request_body.key == null || request_body.key.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Key null"));
        }

        Result<Users> result_user = AuthComponentHelper.getCurrentUser(request);

        if (!result_user.getSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", result_user.getError()));
        }

        Optional<UserSetting> us = this.userSettingService.getByUserId(result_user.getData().getId());

        UserSetting current_setting = null;
        if (us.isEmpty()) {
            current_setting = this.userSettingService
                    .save(new UserSetting(result_user.getData().getId(), "WHISPER_CPP", 0, 30));
        } else {
            current_setting = us.get();
        }

        String fieldName = Character.toLowerCase(request_body.key.charAt(0)) + request_body.key.substring(1);
        Field f = UserSetting.class.getDeclaredField(fieldName);
        f.setAccessible(true);
        Object value = request_body.value;

        Class<?> type = f.getType();

        if (type == int.class || type == Integer.class) {
            value = Integer.parseInt(value.toString());
        } else if (type == long.class || type == Long.class) {
            value = Long.parseLong(value.toString());
        } else if (type == boolean.class || type == Boolean.class) {
            value = Boolean.parseBoolean(value.toString());
        } else if (type == String.class) {
            value = value.toString();
        } else if (type == double.class || type == Double.class) {
            value = Double.parseDouble(value.toString());
        }

        f.set(current_setting, value);

        this.userSettingService.save(current_setting);

        return ResponseEntity.ok(Map.of(
                "message", "Property updated successfully"));
    }

}
