public interface IProfileDataService
{
    Task<UserProfileDataDto> GetUserActivityAsync(int userId);
}

public class UserProfileDataDto
{
    public int UserId { get; set; }
    public UserStatsDto Stats { get; set; } = new();
    public List<VideoActivityDto> Videos { get; set; } = [];
    public List<RecentRecordDto> RecentRecords { get; set; } = [];
}

public class UserStatsDto
{
    public int TotalVideosLearned { get; set; }
    public int TotalRecordingsMade { get; set; }
    public int AverageScore { get; set; }
    public int TotalJobsRun { get; set; }
    public int CompletedJobs { get; set; }
    public int FailedJobs { get; set; }
}

public class VideoActivityDto
{
    public int VideoId { get; set; }
    public string YoutubeId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public int TotalLines { get; set; }
    public int PracticedLines { get; set; }  // lines that have at least 1 record
    public int BestScore { get; set; }
    public int AverageScore { get; set; }
    public DateTime? LastPracticedAt { get; set; }
}

public class RecentRecordDto
{
    public int RecordId { get; set; }
    public string VideoTitle { get; set; } = string.Empty;
    public string TranscriptText { get; set; } = string.Empty;
    public string? ViText { get; set; }
    public int Score { get; set; }
    public string? SttText { get; set; }
    public DateTime CreatedAt { get; set; }
}