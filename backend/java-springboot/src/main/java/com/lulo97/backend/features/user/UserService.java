package com.lulo97.backend.features.user;

import java.util.List;
import java.util.Optional;

import com.lulo97.backend.Result;

public interface UserService {
    List<Users> findAll();
    Users findById(Long id);
    Users create(String username, String rawPassword);
    void delete(Long id);
    Result<Users>  findByToken(String token);
    Optional<Users> findByUsername(String username);
}