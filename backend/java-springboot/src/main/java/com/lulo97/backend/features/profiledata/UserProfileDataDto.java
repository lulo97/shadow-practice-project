package com.lulo97.backend.features.profiledata;

import java.util.ArrayList;
import java.util.List;

public class UserProfileDataDto {
    private Long userId;
    private UserStatsDto stats = new UserStatsDto();
    private List<VideoActivityDto> videos = new ArrayList<>();
    private List<RecentRecordDto> recentRecords = new ArrayList<>();

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public UserStatsDto getStats() { return stats; }
    public void setStats(UserStatsDto stats) { this.stats = stats; }

    public List<VideoActivityDto> getVideos() { return videos; }
    public void setVideos(List<VideoActivityDto> videos) { this.videos = videos; }

    public List<RecentRecordDto> getRecentRecords() { return recentRecords; }
    public void setRecentRecords(List<RecentRecordDto> recentRecords) { this.recentRecords = recentRecords; }
}