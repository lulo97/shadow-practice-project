package com.lulo97.backend.features.transcriptline;

import java.time.LocalDateTime;

public class RecordDto {

    private Long id;
    private String sttText;
    private Double score;
    private String sttProviderKey;
    private LocalDateTime createdAt;

    public RecordDto() {
    }

    public RecordDto(Long id, String sttText, Double score, String sttProviderKey, LocalDateTime createdAt) {
        this.id = id;
        this.sttText = sttText;
        this.score = score;
        this.sttProviderKey = sttProviderKey;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSttText() {
        return sttText;
    }

    public void setSttText(String sttText) {
        this.sttText = sttText;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public String getSttProviderKey() {
        return sttProviderKey;
    }

    public void setSttProviderKey(String sttProviderKey) {
        this.sttProviderKey = sttProviderKey;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public String toString() {
        return "RecordDto{" +
                "id=" + id +
                ", sttText='" + sttText + '\'' +
                ", score=" + score +
                ", sttProviderKey='" + sttProviderKey + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}