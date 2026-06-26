using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly AppDbContext _context;

    public VideosController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> GetList(
    [FromQuery] string? title,
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] string? videoType
)
    {
        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (error.HasValue)
        {
            return Unauthorized(new { message = error.ToString() });
        }

        // Build WHERE conditions
        var whereConditions = new List<string>();
        var parameters = new List<object>();
        int paramIndex = 0;

        // Title filter
        if (!string.IsNullOrWhiteSpace(title))
        {
            whereConditions.Add($"LOWER(v.Title) LIKE LOWER({{{paramIndex}}})");
            parameters.Add($"%{title}%");
            paramIndex++;
        }

        // Date range filters
        if (fromDate.HasValue)
        {
            whereConditions.Add($"v.CreatedAt >= {{{paramIndex}}}");
            parameters.Add(fromDate.Value);
            paramIndex++;
        }

        if (toDate.HasValue)
        {
            whereConditions.Add($"v.CreatedAt <= {{{paramIndex}}}");
            parameters.Add(toDate.Value);
            paramIndex++;
        }

        // User/VideoType filter
        if (videoType == "SYSTEM_VIDEOS")
        {
            whereConditions.Add($"v.UserId = {{{paramIndex}}}");
            parameters.Add(Utils.ADMIN_ID);
        }
        else
        {
            whereConditions.Add($"v.UserId = {{{paramIndex}}}");
            parameters.Add(user.Id);
        }

        // Build the WHERE clause
        var whereClause = whereConditions.Any()
            ? "WHERE " + string.Join(" AND ", whereConditions)
            : "";

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

        var results = await _context.Database
            .SqlQueryRaw<VideoHomepageDto>(sql, parameters.ToArray())
            .ToListAsync();

        return Ok(results);
    }

    public class VideoHomepageDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? YoutubeId { get; set; }
        public string? UserId { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Description { get; set; }
        public int? JobId { get; set; } // Must be nullable (?) because of the LEFT JOIN
        public string? Status { get; set; }
        public int? ProcessPercent { get; set; }
        public DateTime? LastPracticed { get; set; }
    }

    [HttpGet("thumbnail/{video_id}")]
    public async Task<IActionResult> GetThumbnail(int video_id)
    {
        var video = await _context.Videos.FindAsync(video_id);

        if (video == null) return NotFound();
        if (video.Thumbnail == null)
        {
            return Ok(new { message = "Thumbnail not available." });
        }

        return File(video.Thumbnail, "image/jpeg");
    }

    [HttpGet("video_data/{video_id}")]
    public async Task<IActionResult> GetVideoData(int video_id)
    {
        var video = await _context.Videos.FindAsync(video_id);

        if (video == null) return NotFound();
        if (video.BlobData == null) throw new Exception("Video data not available.");

        return File(video.BlobData, "video/mp4", enableRangeProcessing: true);
    }

    [HttpGet("metadata/{video_id}")]
    public async Task<IActionResult> GetVideoMetadata(int video_id)
    {
        var video = await _context.Videos.FindAsync(video_id);

        if (video == null) return NotFound();
        var video_dto = new
        {
            video.Id,
            video.Title,
            video.CreatedAt,
            video.Description,
            video.YoutubeId
        };

        return Ok(video_dto);
    }
}

