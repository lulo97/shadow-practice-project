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
        if (!YoutubeUtils.IsValid(request.YoutubeLink))
        {
            return BadRequest(new { message = "Link invalid" });
        }

        var youtube_id = YoutubeUtils.GetVideoId(request.YoutubeLink) ?? throw new Exception("");

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null) {
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

        var steps = Enum.GetValues<JobStepProcess>();

        var jobSteps = steps.Select(stepName => new JobStep
        {
            JobId = new_job.Id,
            Step = stepName,
            Status = JobStepStatus.PENDING
        });

        await _context.JobSteps.AddRangeAsync(jobSteps);

        await _context.SaveChangesAsync();

        return Ok(new { jobId = new_job.Id });
    }
}

