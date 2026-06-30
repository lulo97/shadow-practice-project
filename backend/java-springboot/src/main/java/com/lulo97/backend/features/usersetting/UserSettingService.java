package com.lulo97.backend.features.usersetting;

import java.util.Optional;

public interface UserSettingService {
    Optional<UserSetting> getByUserId(Long user_id);
    UserSetting save(UserSetting us);
    Optional<UserSetting> findById(Long id);
}
