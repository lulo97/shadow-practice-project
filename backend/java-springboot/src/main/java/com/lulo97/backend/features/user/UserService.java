package com.lulo97.backend.features.user;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<Users> findAll();
    Users findById(Long id);
    Users create(String username, String rawPassword);
    void delete(Long id);
    Optional<Users> findByToken(String token);
    Optional<Users> findByUsername(String username);
}