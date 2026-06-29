package com.lulo97.backend.features.session;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, Long> {
        @Query("""
                SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END
                FROM Session s
                WHERE s.user_id = :user_id
                AND s.token = :token
                AND s.expires_at > CURRENT_TIMESTAMP
        """)
        boolean existsValidToken(
                @Param("user_id") Long userId,
                @Param("token") String token);
}