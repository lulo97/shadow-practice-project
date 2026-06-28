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
@Table(name="users")
public class Users {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="username", nullable = false)
    private String username;

    @Column(name="password_hashed", nullable = false)
    private String password_hashed;

    @CreationTimestamp
    @Column(name="created_at", nullable = false)
    private LocalDateTime created_at;

    public Long getId() {
        return id;
    }
}
