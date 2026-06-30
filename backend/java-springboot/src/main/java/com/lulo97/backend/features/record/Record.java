package com.lulo97.backend.features.record;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.LocalDateTime;

import com.lulo97.backend.NoLockId;

@Entity
@Table(name = "record")
public class Record {

    @Id
    @NoLockId
    @Column(name = "id")
    private Integer id;

    @NotNull
    @Column(name = "video_id", nullable = false)
    private Integer videoId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @NotNull
    @Column(name = "transcript_line_id", nullable = false)
    private Integer transcriptLineId;

    @Column(name = "file_path")
    private String filePath;

    @Lob
    @Column(name = "blob_data")
    private byte[] blobData;

    @Min(0)
    @Max(100)
    @Column(name = "score")
    private Integer score = 0;

    @Column(name = "stt_text")
    private String sttText;

    @Column(name = "stt_provider_key")
    private String sttProviderKey;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // plain getters/setters, no annotations
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getVideoId() { return videoId; }
    public void setVideoId(Integer videoId) { this.videoId = videoId; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getTranscriptLineId() { return transcriptLineId; }
    public void setTranscriptLineId(Integer transcriptLineId) { this.transcriptLineId = transcriptLineId; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public byte[] getBlobData() { return blobData; }
    public void setBlobData(byte[] blobData) { this.blobData = blobData; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getSttText() { return sttText; }
    public void setSttText(String sttText) { this.sttText = sttText; }

    public String getSttProviderKey() { return sttProviderKey; }
    public void setSttProviderKey(String sttProviderKey) { this.sttProviderKey = sttProviderKey; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}