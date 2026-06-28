package com.lulo97.backend.features.auth;

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
    private String user_id;

    @Column(name="token", nullable = false)
    private String token;

    
    @CreationTimestamp
    @Column(name="created_at", nullable = false)
    private LocalDateTime created_at;

    @Column(name="expires_at", nullable = false)
    private LocalDateTime expires_at;
}
