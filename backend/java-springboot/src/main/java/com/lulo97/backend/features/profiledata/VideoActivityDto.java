package com.lulo97.backend.features.profiledata;

import java.time.LocalDateTime;

public class VideoActivityDto {
    private int videoId;
    private String youtubeId = "";
    private String title = "";
    private int totalLines;
    private int practicedLines;
    private int bestScore;
    private int averageScore;
    private LocalDateTime lastPracticedAt;

    public int getVideoId() { return videoId; }
    public void setVideoId(int videoId) { this.videoId = videoId; }

    public String getYoutubeId() { return youtubeId; }
    public void setYoutubeId(String youtubeId) { this.youtubeId = youtubeId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public int getTotalLines() { return totalLines; }
    public void setTotalLines(int totalLines) { this.totalLines = totalLines; }

    public int getPracticedLines() { return practicedLines; }
    public void setPracticedLines(int practicedLines) { this.practicedLines = practicedLines; }

    public int getBestScore() { return bestScore; }
    public void setBestScore(int bestScore) { this.bestScore = bestScore; }

    public int getAverageScore() { return averageScore; }
    public void setAverageScore(int averageScore) { this.averageScore = averageScore; }

    public LocalDateTime getLastPracticedAt() { return lastPracticedAt; }
    public void setLastPracticedAt(LocalDateTime lastPracticedAt) { this.lastPracticedAt = lastPracticedAt; }
}