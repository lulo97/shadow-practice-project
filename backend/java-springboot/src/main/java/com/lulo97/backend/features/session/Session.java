package com.lulo97.backend.features.session;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="session")
public class Session {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="user_id", nullable = false)
    private Long user_id;          // Long, not String

    @Column(name="token", nullable = false)
    private String token;

    @CreationTimestamp
    @Column(name="created_at", nullable = false)
    private LocalDateTime created_at;

    @Column(name="expires_at", nullable = false)
    private LocalDateTime expires_at;

    public Long getId() { return id; }
    public Long getUserId() { return user_id; }
    public String getToken() { return token; }
    public LocalDateTime getCreatedAt() { return created_at; }
    public LocalDateTime getExpiresAt() { return expires_at; }

    public void setUserId(Long user_id) { this.user_id = user_id; }
    public void setToken(String token) { this.token = token; }
    public void setExpiresAt(LocalDateTime expires_at) { this.expires_at = expires_at; }
}