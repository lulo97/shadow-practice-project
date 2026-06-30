package com.lulo97.backend.features.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<Users, Long> {
    Optional<Users> findByUsername(String username);
    boolean existsByUsername(String username);
    // @Query("SELECT u FROM Users u JOIN Session s ON s.user_id = u.id WHERE s.token = :token AND s.expires_at > CURRENT_TIMESTAMP")
    // Optional<Users> findByToken(@Param("token") String token);
}