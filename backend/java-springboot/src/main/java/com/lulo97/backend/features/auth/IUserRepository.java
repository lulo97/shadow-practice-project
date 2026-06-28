package com.lulo97.backend.features.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface IUserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByToken(String token);
}
