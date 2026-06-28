using Microsoft.EntityFrameworkCore;

public class ProfileDataServicePostgres : IProfileDataService
{
    private readonly AppDbContext _db;

    public ProfileDataServicePostgres(AppDbContext db)
    {
        _db = db;
    }

    public async Task<UserProfileDataDto> GetUserActivityAsync(int userId)
    {
        var recordsQuery = _db.Records.Where(r => r.UserId == userId);
        var jobsQuery = _db.Jobs.Where(j => j.UserId == userId);

        var stats = new UserStatsDto
        {
            TotalJobsRun = await jobsQuery.CountAsync(),
            CompletedJobs = await jobsQuery.CountAsync(j => j.Status == JobStatus.Done),
            FailedJobs = await jobsQuery.CountAsync(j => j.Status == JobStatus.Failed),
            TotalRecordingsMade = await recordsQuery.CountAsync(),
            AverageScore = (int)(await recordsQuery.AverageAsync(r => (double?)r.Score) ?? 0),
            TotalVideosLearned = await recordsQuery.Select(r => r.VideoId).Distinct().CountAsync()
        };

        var videoActivities = await (
            from v in _db.Videos
            join r in _db.Records on v.Id equals r.VideoId
            where r.UserId == userId
            group r by new { v.Id, v.YoutubeId, v.Title } into g
            select new VideoActivityDto
            {
                VideoId = g.Key.Id,
                YoutubeId = g.Key.YoutubeId,
                Title = g.Key.Title,
                BestScore = g.Max(r => r.Score),
                AverageScore = (int)g.Average(r => r.Score),
                PracticedLines = g.Select(r => r.TranscriptLineId).Distinct().Count(),
                LastPracticedAt = g.Max(r => r.CreatedAt)
            }
        ).ToListAsync();

        var videoIds = videoActivities.Select(v => v.VideoId).ToList();
        var lineCounts = await _db.TranscriptLines
            .Where(tl => videoIds.Contains(tl.VideoId))
            .GroupBy(tl => tl.VideoId)
            .Select(g => new { VideoId = g.Key, Count = g.Count() })
            .ToListAsync();

        foreach (var va in videoActivities)
            va.TotalLines = lineCounts.FirstOrDefault(lc => lc.VideoId == va.VideoId)?.Count ?? 0;

        var recentRecords = await (
            from r in _db.Records
            join tl in _db.TranscriptLines on r.TranscriptLineId equals tl.Id
            join v in _db.Videos on r.VideoId equals v.Id
            where r.UserId == userId
            orderby r.CreatedAt descending
            select new RecentRecordDto
            {
                RecordId = r.Id,
                VideoTitle = v.Title,
                TranscriptText = tl.Text,
                ViText = tl.ViText,
                Score = r.Score,
                SttText = r.SttText,
                CreatedAt = r.CreatedAt
            }
        ).Take(20).ToListAsync();

        return new UserProfileDataDto
        {
            UserId = userId,
            Stats = stats,
            Videos = videoActivities,
            RecentRecords = recentRecords
        };
    }
}