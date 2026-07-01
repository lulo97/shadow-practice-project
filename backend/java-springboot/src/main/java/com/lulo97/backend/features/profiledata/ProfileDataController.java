package com.lulo97.backend.features.profiledata;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.lulo97.backend.Result;
import com.lulo97.backend.features.auth.AuthComponentHelper;
import com.lulo97.backend.features.user.Users;
import java.util.Map;

@RestController
@RequestMapping("/api/profiledata")
public class ProfileDataController {

    private final ProfileDataService profileDataService;

    public ProfileDataController(ProfileDataService profileDataService) {
        this.profileDataService = profileDataService;
    }

    @GetMapping
    public ResponseEntity<?> getProfileData(HttpServletRequest request) {
        Result<Users> result = AuthComponentHelper.getCurrentUser(request);

        if (result.getError() != null || result.getData() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", result.getError()));
        }

        Users user = result.getData();
        UserProfileDataDto data = profileDataService.getUserActivity(user.getId());

        return ResponseEntity.ok(data);
    }
}
