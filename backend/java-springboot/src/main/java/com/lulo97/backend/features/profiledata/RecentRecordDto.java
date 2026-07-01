package com.lulo97.backend.features.profiledata;

import java.time.LocalDateTime;

public class RecentRecordDto {
    private int recordId;
    private String videoTitle = "";
    private String transcriptText = "";
    private String viText;
    private int score;
    private String sttText;
    private LocalDateTime createdAt;

    public int getRecordId() { return recordId; }
    public void setRecordId(int recordId) { this.recordId = recordId; }

    public String getVideoTitle() { return videoTitle; }
    public void setVideoTitle(String videoTitle) { this.videoTitle = videoTitle; }

    public String getTranscriptText() { return transcriptText; }
    public void setTranscriptText(String transcriptText) { this.transcriptText = transcriptText; }

    public String getViText() { return viText; }
    public void setViText(String viText) { this.viText = viText; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getSttText() { return sttText; }
    public void setSttText(String sttText) { this.sttText = sttText; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}