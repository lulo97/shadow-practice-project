package com.lulo97.backend.features.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
        @Query("SELECT s FROM Session s WHERE s.token = :token AND s.user_id = :user_id")
        Optional<Session> findByTokenAndUserId(@Param("user_id") Long user_id, @Param("token") String token);

        @Query("SELECT s FROM Session s WHERE s.token = :token")
        Optional<Session> findByToken(@Param("token") String token);
}