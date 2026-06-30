package com.lulo97.backend.features.usersetting;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserSettingImpl implements UserSettingService {

    private final UserSettingRepository userSettingRepository;

    public UserSettingImpl(UserSettingRepository userSettingRepository) {
        this.userSettingRepository = userSettingRepository;
    }

    @Override
    public Optional<UserSetting> getByUserId(Long user_id) {
        return this.userSettingRepository.getByUserId(user_id);
    }

    @Override
    public UserSetting save(UserSetting us) {
        return this.userSettingRepository.save(us);
    }

    @Override
    public Optional<UserSetting> findById(Long id) {
        return this.userSettingRepository.findById(id);
    }

}
