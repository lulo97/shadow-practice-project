package com.lulo97.backend.features.usersetting;

import com.lulo97.backend.NoLockId;

import jakarta.persistence.*;

@Entity
@Table(name = "user_setting")
public class UserSetting {

    @Id
    @NoLockId
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "stt_provider_key", nullable = false)
    private String sttProviderKey;

    // 0 = off, 1 = on
    @Column(name = "loop")
    private int loop;

    @Column(name = "video_width_size")
    private double videoWidthSize;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getSttProviderKey() {
        return sttProviderKey;
    }

    public void setSttProviderKey(String sttProviderKey) {
        this.sttProviderKey = sttProviderKey;
    }

    public int getLoop() {
        return loop;
    }

    public void setLoop(int loop) {
        this.loop = loop;
    }

    public double getVideoWidthSize() {
        return videoWidthSize;
    }

    public void setVideoWidthSize(double videoWidthSize) {
        this.videoWidthSize = videoWidthSize;
    }

    public UserSetting() {

    }

    public UserSetting(Long user_id, String sttProviderKey, int loop, int videoWidthSize) {
        this.userId = user_id;
        this.sttProviderKey = sttProviderKey;
        this.videoWidthSize = videoWidthSize;
    }
}