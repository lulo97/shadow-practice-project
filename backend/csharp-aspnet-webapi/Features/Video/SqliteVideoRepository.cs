using Microsoft.EntityFrameworkCore;
using static VideosController;

public class SqliteVideoRepository : IVideoRepository
{
    private readonly AppDbContext _context;

    public SqliteVideoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<VideoHomepageDto>> GetListAsync(int userId, VideoListFilter filter)
    {
        var whereConditions = new List<string>();
        var parameters = new List<object>();
        int paramIndex = 0;

        if (!string.IsNullOrWhiteSpace(filter.Title))
        {
            whereConditions.Add($"LOWER(v.Title) LIKE LOWER({{{paramIndex}}})");
            parameters.Add($"%{filter.Title}%");
            paramIndex++;
        }

        if (filter.FromDate.HasValue)
        {
            whereConditions.Add($"v.CreatedAt >= {{{paramIndex}}}");
            parameters.Add(filter.FromDate.Value);
            paramIndex++;
        }

        if (filter.ToDate.HasValue)
        {
            whereConditions.Add($"v.CreatedAt <= {{{paramIndex}}}");
            parameters.Add(filter.ToDate.Value);
            paramIndex++;
        }

        whereConditions.Add($"v.UserId = {{{paramIndex}}}");
        parameters.Add(filter.VideoType == "SYSTEM_VIDEOS" ? Utils.ADMIN_ID : userId);

        var whereClause = "WHERE " + string.Join(" AND ", whereConditions);

        var sql = $@"
            SELECT 
                v.Id, 
                v.Title, 
                v.YoutubeId, 
                v.UserId, 
                v.CreatedAt, 
                v.Description,
                MAX(j.Id) AS JobId,
        
                CASE 
                    WHEN COUNT(tl.Id) = 0 THEN 'NOT_STARTED'
                    WHEN COUNT(r.TranscriptLineId) = 0 THEN 'NOT_STARTED'
                    WHEN COUNT(DISTINCT r.TranscriptLineId) < COUNT(DISTINCT tl.Id) THEN 'UNFINISHED'
                    ELSE 'FINISHED'
                END AS Status,

                CAST(COUNT(DISTINCT r.TranscriptLineId) AS REAL) / NULLIF(COUNT(DISTINCT tl.Id), 0) * 100 AS ProcessPercent,

                MAX(r.CreatedAt) AS LastPracticed

            FROM Videos v
            LEFT JOIN Jobs j ON v.Id = j.VideoId
            LEFT JOIN TranscriptLines tl ON v.Id = tl.VideoId
            LEFT JOIN Records r ON tl.Id = r.TranscriptLineId
            {whereClause}
            GROUP BY 
                v.Id, v.Title, v.YoutubeId, v.UserId, v.CreatedAt, v.Description;
        ";

        return await _context.Database
            .SqlQueryRaw<VideoHomepageDto>(sql, parameters.ToArray())
            .ToListAsync();
    }
}