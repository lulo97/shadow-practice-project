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

    [HttpGet("")]
    public async Task<IActionResult> GetList(
    [FromQuery] string? title,
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] string? videoType
    )
    {
        var query = _context.Videos.AsQueryable();

        // Apply filters if parameters are provided
        if (!string.IsNullOrWhiteSpace(title))
        {
            query = query.Where(v => v.Title.ToLower().Contains(title.ToLower()));
        }

        if (fromDate.HasValue)
        {
            query = query.Where(v => v.CreatedAt >= fromDate.Value);
        }

        if (toDate.HasValue)
        {
            query = query.Where(v => v.CreatedAt <= toDate.Value);
        }

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (error.HasValue)
        {
            return Unauthorized(new { message = error.ToString() });
        }

        if (videoType == "SYSTEM_VIDEOS")
        {
            query = query.Where(v => v.UserId == Utils.ADMIN_ID);
        }
        else
        {
            query = query.Where(v => v.UserId == user.Id);
        }

        var sql = @"
            SELECT 
                v.Id, 
                v.Title, 
                v.YoutubeId, 
                v.UserId, 
                v.CreatedAt, 
                v.Description,
                MAX(j.Id) AS JobId, -- Using MAX to handle grouping if a video has one job
        
                CASE 
                    -- 1. If there are no transcript lines at all
                    WHEN COUNT(tl.Id) = 0 THEN 'NOT_STARTED'
            
                    -- 2. If the count of matching records is 0 (all tl have no record)
                    WHEN COUNT(r.TranscriptLineId) = 0 THEN 'NOT_STARTED'
            
                    -- 3. If some transcript lines have records, but not all of them
                    WHEN COUNT(DISTINCT r.TranscriptLineId) < COUNT(DISTINCT tl.Id) THEN 'UNFINISHED'
            
                    -- 4. If every transcript line has a matching record
                    ELSE 'FINISHED'
                END AS Status,

                CAST(COUNT(DISTINCT r.TranscriptLineId) AS REAL) / COUNT(DISTINCT tl.Id) * 100 AS ProcessPercent,

                MAX(r.CreatedAt) AS LastPracticed

            FROM Videos v
            LEFT JOIN Jobs j ON v.Id = j.VideoId
            LEFT JOIN TranscriptLines tl ON v.Id = tl.VideoId
            LEFT JOIN Records r ON tl.Id = r.TranscriptLineId
            GROUP BY 
                v.Id, v.Title, v.YoutubeId, v.UserId, v.CreatedAt, v.Description;
        ";

        var results = await _context.Database
            .SqlQueryRaw<VideoHomepageDto>(sql)
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

