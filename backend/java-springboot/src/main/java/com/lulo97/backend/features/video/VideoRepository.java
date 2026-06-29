package com.lulo97.backend.features.video;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;

import com.lulo97.backend.Result;
import com.lulo97.backend.features.user.Users;

public interface VideoRepository extends JpaRepository<Users, Long> {

}
