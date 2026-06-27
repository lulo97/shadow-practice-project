using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using System.Linq;

[ApiController]
[Route("api/[controller]")]
public class VideosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IVideoFileReader _videoReader;
    private readonly IVideoRepository _videoRepository;

    public VideosController(AppDbContext context, IVideoFileReader videoFileReader, IVideoRepository videoRepository)
    {
        _context = context;
        _videoReader = videoFileReader;
        _videoRepository = videoRepository;
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
            return NotFound(new { message = "User not found" });

        if (error.HasValue)
            return Unauthorized(new { message = error.ToString() });

        var filter = new VideoListFilter(title, fromDate, toDate, videoType);
        var results = await _videoRepository.GetListAsync(user.Id, filter);

        return Ok(results);
    }

    public class VideoHomepageDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? YoutubeId { get; set; }
        public int? UserId { get; set; }
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

        var file = await _videoReader.ReadThumbnailAsync(video);

        if (file == null || file.Length == 0)
        {
            return Ok(new { message = "Thumbnail not available." });
        }
        return File(file, "image/jpeg");
    }

    [HttpGet("video_data/{video_id}")]
    public async Task<IActionResult> GetVideoData(int video_id)
    {
        var video = await _context.Videos.FindAsync(video_id);

        if (video == null) return NotFound();

        var file = await _videoReader.ReadVideoAsync(video);

        if (file == null || file.Length == 0) return Ok(new { message = "Video data not available." });

        return File(file, "video/mp4", enableRangeProcessing: true);
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

