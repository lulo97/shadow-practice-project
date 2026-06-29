package com.lulo97.backend.features.record;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

@Entity
@Table(name = "record")
public class Record {

    private Integer id;
    private Integer videoId;
    private Integer userId;
    private Integer transcriptLineId;
    private String filePath;
    private byte[] blobData;
    private Integer score = 0;
    private String sttText;
    private String sttProviderKey;
    private LocalDateTime createdAt = LocalDateTime.now();


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }


    @NotNull
    @Column(name = "video_id", nullable = false)
    public Integer getVideoId() {
        return videoId;
    }

    public void setVideoId(Integer videoId) {
        this.videoId = videoId;
    }


    @NotNull
    @Column(name = "user_id", nullable = false)
    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }


    @NotNull
    @Column(name = "transcript_line_id", nullable = false)
    public Integer getTranscriptLineId() {
        return transcriptLineId;
    }

    public void setTranscriptLineId(Integer transcriptLineId) {
        this.transcriptLineId = transcriptLineId;
    }


    @Column(name = "file_path")
    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }


    @Lob
    @Column(name = "blob_data")
    public byte[] getBlobData() {
        return blobData;
    }

    public void setBlobData(byte[] blobData) {
        this.blobData = blobData;
    }


    @Min(0)
    @Max(100)
    @Column(name = "score")
    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }


    @Column(name = "stt_text")
    public String getSttText() {
        return sttText;
    }

    public void setSttText(String sttText) {
        this.sttText = sttText;
    }


    @Column(name = "stt_provider_key")
    public String getSttProviderKey() {
        return sttProviderKey;
    }

    public void setSttProviderKey(String sttProviderKey) {
        this.sttProviderKey = sttProviderKey;
    }


    @Column(name = "created_at")
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}