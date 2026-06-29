package com.lulo97.backend.features.user;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<UserDTO> findAll();
    UserDTO findById(Long id);
    UserDTO create(String username, String rawPassword);
    void delete(Long id);
    Optional<UserDTO> findByToken(String token);
}