package com.lulo97.backend.features.transcriptline;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "transcript_line")
public class TranscriptLine {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE) //Other GenerationType type make sqlite column id with no column type error
    @Column(name = "id", columnDefinition = "INTEGER")
    private Long id;

    @NotNull
    @Column(name = "video_id", nullable = false)
    private Long videoId;

    @NotNull
    @Column(name = "line_index", nullable = false)
    private Integer lineIndex;

    @NotNull
    @Column(name = "text", nullable = false)
    private String text = "";

    @Column(name = "vi_text")
    private String viText;

    @NotNull
    @Column(name = "start", nullable = false)
    private double start;

    @NotNull
    @Column(name = "end", nullable = false)
    private double end;

    @NotNull
    @Column(name = "skip", nullable = false)
    private Integer skip = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // plain getters/setters, no annotations
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getVideoId() { return videoId; }
    public void setVideoId(Long videoId) { this.videoId = videoId; }

    public Integer getLineIndex() { return lineIndex; }
    public void setLineIndex(Integer lineIndex) { this.lineIndex = lineIndex; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getViText() { return viText; }
    public void setViText(String viText) { this.viText = viText; }

    public double getStart() { return start; }
    public void setStart(double start) { this.start = start; }

    public double getEnd() { return end; }
    public void setEnd(double end) { this.end = end; }

    public Integer getSkip() { return skip; }
    public void setSkip(Integer skip) { this.skip = skip; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}