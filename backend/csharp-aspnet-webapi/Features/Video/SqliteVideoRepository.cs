using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;
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
            whereConditions.Add($"LOWER(v.title) LIKE LOWER({{{paramIndex}}})");
            parameters.Add($"%{filter.Title}%");
            paramIndex++;
        }

        if (filter.FromDate.HasValue)
        {
            whereConditions.Add($"v.created_at >= {{{paramIndex}}}");
            parameters.Add(filter.FromDate.Value);
            paramIndex++;
        }

        if (filter.ToDate.HasValue)
        {
            whereConditions.Add($"v.created_at <= {{{paramIndex}}}");
            parameters.Add(filter.ToDate.Value);
            paramIndex++;
        }

        whereConditions.Add($"v.user_id = {{{paramIndex}}}");
        parameters.Add(filter.VideoType == "SYSTEM_VIDEOS" ? Utils.ADMIN_ID : userId);

        var whereClause = "WHERE " + string.Join(" AND ", whereConditions);

        //In a C# verbatim string (@"..."), "" is the escape sequence for a literal ".
        //So AS ""Id"" becomes AS "Id" — which is valid in PostgreSQL but not in SQLite

        var sql = $@"
            SELECT 
                v.id AS Id, 
                v.title AS Title, 
                v.youtube_id AS YoutubeId, 
                v.user_id AS UserId, 
                v.created_at AS CreatedAt, 
                v.description AS Description,
                MAX(j.id) AS JobId,

                CASE
                    WHEN COUNT(tl.id) = 0 THEN 'NOT_STARTED'
                    WHEN COUNT(DISTINCT CASE WHEN tl.skip = 0 THEN r.transcript_line_id END) = 0 
                         AND COUNT(DISTINCT CASE WHEN tl.skip = 1 THEN tl.id END) = 0 THEN 'NOT_STARTED'
                    WHEN (
                        COUNT(DISTINCT CASE WHEN tl.skip = 0 THEN r.transcript_line_id END) + 
                        COUNT(DISTINCT CASE WHEN tl.skip = 1 THEN tl.id END)
                    ) < COUNT(DISTINCT tl.id) THEN 'UNFINISHED'
                    ELSE 'FINISHED'
                END AS Status,

                CAST(
                    (
                        COUNT(DISTINCT CASE WHEN tl.skip = 0 THEN r.transcript_line_id END) + 
                        COUNT(DISTINCT CASE WHEN tl.skip = 1 THEN tl.id END)
                    ) * 100 / NULLIF(COUNT(DISTINCT tl.id), 0) 
                AS INT) AS ProcessPercent,

                MAX(r.created_at) AS LastPracticed

            FROM video v
            LEFT JOIN job j ON v.id = j.video_id
            LEFT JOIN transcript_line tl ON v.id = tl.video_id
            LEFT JOIN record r ON tl.id = r.transcript_line_id
            {whereClause}
            GROUP BY 
                v.id, v.title, v.youtube_id, v.user_id, v.created_at, v.description
            ORDER BY v.created_at desc
            ;
        ";

        return await _context.Database
            .SqlQueryRaw<VideoHomepageDto>(sql, parameters.ToArray())
            .ToListAsync();
    }
}