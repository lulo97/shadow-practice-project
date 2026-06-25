using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class JobController : ControllerBase
{
    private readonly AppDbContext _context;

    public JobController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost("video")]
    public async Task<IActionResult> Video([FromBody] JobRequest request)
    {
        Console.WriteLine($"[API Controller] Handling request on Thread ID: {Environment.CurrentManagedThreadId}");

        var (valid, valid_message) = YoutubeUtils.IsValid(request.YoutubeLink);

        if (!valid)
        {
            return BadRequest(new { message = valid_message });
        }

        var youtube_id = YoutubeUtils.GetVideoId(request.YoutubeLink) ?? throw new Exception("");

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (error.HasValue)
        {
            return Unauthorized(new { message = error.ToString() });
        }

        var new_video = new Video { UserId = user.Id, YoutubeId = youtube_id };

        _context.Videos.Add(new_video);

        await _context.SaveChangesAsync();

        var new_job = new Job
        {
            UserId = user.Id,
            VideoId = new_video.Id,
            Status = JobStatus.Queued,
            Type = JobType.VideoIngest,
        };

        _context.Jobs.Add(new_job);

        await _context.SaveChangesAsync();

        return Ok(new { jobId = new_job.Id });
    }

    [HttpGet("video-detail/{job_id}")]
    public async Task<IActionResult> VideoDetail(int job_id)
    {
        var job = await _context.Jobs
            .FirstOrDefaultAsync(j => j.Id == job_id);

        if (job == null)
        {
            return NotFound();
        }

        var job_steps = await _context.JobSteps
            .Where(x => x.JobId == job_id)
            .ToListAsync();

        return Ok(new
        {
            job,
            jobSteps = job_steps
        });
    }
}

