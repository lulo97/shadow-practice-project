package com.lulo97.backend.features.video;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.lulo97.backend.NoLockId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "video")
public class Video {
    @Id
    @NoLockId
    @Column(name = "id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long user_id;

    @Column(name = "youtube_id", nullable = false)
    private String youtube_id;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private LocalDateTime created_at;

    @Column(name = "filename", nullable = true)
    private String filename;

    @Column(name = "blob_data", nullable = true)
    private byte[] blob_data;

    @Column(name = "audio_filename", nullable = true)
    private String audio_filename;

    @Column(name = "audio_blob_data", nullable = true)
    private byte[] audio_blob_data;

    @Column(name = "thumbnail_file_name", nullable = true)
    private String thumbnail_file_name;

    @Column(name = "thumbnail", nullable = true)
    private byte[] thumbnail;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = true)
    private String description;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUser_id() {
        return user_id;
    }

    public void setUser_id(Long user_id) {
        this.user_id = user_id;
    }

    public String getYoutube_id() {
        return youtube_id;
    }

    public void setYoutube_id(String youtube_id) {
        this.youtube_id = youtube_id;
    }

    public LocalDateTime getCreated_at() {
        return created_at;
    }

    public void setCreated_at(LocalDateTime created_at) {
        this.created_at = created_at;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public byte[] getBlob_data() {
        return blob_data;
    }

    public void setBlob_data(byte[] blob_data) {
        this.blob_data = blob_data;
    }

    public String getAudio_filename() {
        return audio_filename;
    }

    public void setAudio_filename(String audio_filename) {
        this.audio_filename = audio_filename;
    }

    public byte[] getAudio_blob_data() {
        return audio_blob_data;
    }

    public void setAudio_blob_data(byte[] audio_blob_data) {
        this.audio_blob_data = audio_blob_data;
    }

    public String getThumbnail_file_name() {
        return thumbnail_file_name;
    }

    public void setThumbnail_file_name(String thumbnail_file_name) {
        this.thumbnail_file_name = thumbnail_file_name;
    }

    public byte[] getThumbnail() {
        return thumbnail;
    }

    public void setThumbnail(byte[] thumbnail) {
        this.thumbnail = thumbnail;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Video(Long user_id, String title, String description, String youtube_id) {
        this.user_id = user_id;
        this.title = title;
        this.description = description;
        this.youtube_id = youtube_id;
    }

    public Video() {};
}
