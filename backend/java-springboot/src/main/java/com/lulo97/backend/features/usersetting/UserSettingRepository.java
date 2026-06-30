package com.lulo97.backend.features.usersetting;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserSettingRepository extends JpaRepository<UserSetting, Long> {

    @Query("""
            SELECT us FROM UserSetting us WHERE us.userId = :userId
            """)
    Optional<UserSetting> getByUserId(@Param("userId") Long userId);
}
