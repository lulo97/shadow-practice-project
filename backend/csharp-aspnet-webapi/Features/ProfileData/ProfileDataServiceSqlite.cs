using Microsoft.EntityFrameworkCore;

public class ProfileDataServiceSqlite : IProfileDataService
{
    private readonly AppDbContext _db;

    public ProfileDataServiceSqlite(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserProfileDataDto> GetUserActivityAsync(int userId)
    {
        var jobs = await _db.Jobs
            .Where(j => j.UserId == userId)
            .ToListAsync();

        var records = await _db.Records
            .Where(r => r.UserId == userId)
            .ToListAsync();

        var stats = new UserStatsDto
        {
            TotalJobsRun = jobs.Count,
            CompletedJobs = jobs.Count(j => j.Status == JobStatus.Done),
            FailedJobs = jobs.Count(j => j.Status == JobStatus.Failed),
            TotalRecordingsMade = records.Count,
            AverageScore = records.Any() ? (int)records.Average(r => r.Score) : 0,
            TotalVideosLearned = records.Select(r => r.VideoId).Distinct().Count()
        };

        var videoIds = records.Select(r => r.VideoId).Distinct().ToList();

        var videos = await _db.Videos
            .Where(v => videoIds.Contains(v.Id))
            .ToListAsync();

        var transcriptLines = await _db.TranscriptLines
            .Where(tl => videoIds.Contains(tl.VideoId))
            .ToListAsync();

        var videoActivities = videos.Select(v =>
        {
            var videoRecords = records.Where(r => r.VideoId == v.Id).ToList();
            var totalLines = transcriptLines.Count(tl => tl.VideoId == v.Id);
            var practicedLineIds = videoRecords.Select(r => r.TranscriptLineId).Distinct().ToHashSet();

            return new VideoActivityDto
            {
                VideoId = v.Id,
                YoutubeId = v.YoutubeId,
                Title = v.Title,
                TotalLines = totalLines,
                PracticedLines = practicedLineIds.Count,
                BestScore = videoRecords.Any() ? videoRecords.Max(r => r.Score) : 0,
                AverageScore = videoRecords.Any() ? (int)videoRecords.Average(r => r.Score) : 0,
                LastPracticedAt = videoRecords.Any() ? videoRecords.Max(r => r.CreatedAt) : null
            };
        }).ToList();

        var recentRecordIds = records
            .OrderByDescending(r => r.CreatedAt)
            .Take(20)
            .Select(r => r.Id)
            .ToHashSet();

        var recentRecords = records
            .Where(r => recentRecordIds.Contains(r.Id))
            .Select(r =>
            {
                var tl = transcriptLines.FirstOrDefault(t => t.Id == r.TranscriptLineId);
                var video = videos.FirstOrDefault(v => v.Id == r.VideoId);
                return new RecentRecordDto
                {
                    RecordId = r.Id,
                    VideoTitle = video?.Title ?? string.Empty,
                    TranscriptText = tl?.Text ?? string.Empty,
                    ViText = tl?.ViText,
                    Score = r.Score,
                    SttText = r.SttText,
                    CreatedAt = r.CreatedAt
                };
            })
            .OrderByDescending(r => r.CreatedAt)
            .ToList();

        return new UserProfileDataDto
        {
            UserId = userId,
            Stats = stats,
            Videos = videoActivities,
            RecentRecords = recentRecords
        };
    }
}