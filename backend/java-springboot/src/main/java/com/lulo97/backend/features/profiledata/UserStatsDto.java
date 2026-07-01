package com.lulo97.backend.features.profiledata;

public class UserStatsDto {
    private int totalVideosLearned;
    private int totalRecordingsMade;
    private int averageScore;
    private int totalJobsRun;
    private int completedJobs;
    private int failedJobs;

    public int getTotalVideosLearned() { return totalVideosLearned; }
    public void setTotalVideosLearned(int totalVideosLearned) { this.totalVideosLearned = totalVideosLearned; }

    public int getTotalRecordingsMade() { return totalRecordingsMade; }
    public void setTotalRecordingsMade(int totalRecordingsMade) { this.totalRecordingsMade = totalRecordingsMade; }

    public int getAverageScore() { return averageScore; }
    public void setAverageScore(int averageScore) { this.averageScore = averageScore; }

    public int getTotalJobsRun() { return totalJobsRun; }
    public void setTotalJobsRun(int totalJobsRun) { this.totalJobsRun = totalJobsRun; }

    public int getCompletedJobs() { return completedJobs; }
    public void setCompletedJobs(int completedJobs) { this.completedJobs = completedJobs; }

    public int getFailedJobs() { return failedJobs; }
    public void setFailedJobs(int failedJobs) { this.failedJobs = failedJobs; }
}