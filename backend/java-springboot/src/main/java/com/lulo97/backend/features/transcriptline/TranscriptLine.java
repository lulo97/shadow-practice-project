package com.lulo97.backend.features.transcriptline;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "transcript_line")
public class TranscriptLine {

    private Long id;
    private Long videoId;
    private Integer lineIndex;
    private String text = "";
    private String viText;
    private double start;
    private double end;
    private Integer skip = 0;
    private LocalDateTime createdAt = LocalDateTime.now();


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    @NotNull
    @Column(name = "video_id", nullable = false)
    public Long getVideoId() {
        return videoId;
    }

    public void setVideoId(Long videoId) {
        this.videoId = videoId;
    }


    @NotNull
    @Column(name = "line_index", nullable = false)
    public Integer getLineIndex() {
        return lineIndex;
    }

    public void setLineIndex(Integer lineIndex) {
        this.lineIndex = lineIndex;
    }


    @NotNull
    @Column(name = "text", nullable = false)
    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }


    @Column(name = "vi_text")
    public String getViText() {
        return viText;
    }

    public void setViText(String viText) {
        this.viText = viText;
    }


    @NotNull
    @Column(name = "start", nullable = false)
    public double getStart() {
        return start;
    }

    public void setStart(double start) {
        this.start = start;
    }


    @NotNull
    @Column(name = "end", nullable = false)
    public double getEnd() {
        return end;
    }

    public void setEnd(double end) {
        this.end = end;
    }


    @NotNull
    @Column(name = "skip", nullable = false)
    public Integer getSkip() {
        return skip;
    }

    public void setSkip(Integer skip) {
        this.skip = skip;
    }


    @Column(name = "created_at")
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}