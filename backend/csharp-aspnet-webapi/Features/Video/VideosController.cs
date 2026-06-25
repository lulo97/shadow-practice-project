using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
    public async Task<IActionResult> GetList()
    {
        var videos = await _context.Videos
            .GroupJoin(
                _context.Jobs,
                video => video.Id,
                job => job.VideoId,
                (video, jobs) => new { video, jobs }
            )
            .SelectMany(
                x => x.jobs.DefaultIfEmpty(),
                (x, job) => new
                {
                    x.video.Id,
                    x.video.Title,
                    x.video.YoutubeId,
                    x.video.UserId,
                    x.video.CreatedAt,
                    x.video.Description,
                    JobId = job != null ? (int?)job.Id : null
                }
            )
            .ToListAsync();

        return Ok(videos);
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

