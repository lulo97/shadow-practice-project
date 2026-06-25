using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class TranscriptsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TranscriptsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{video_id}")]
    public async Task<IActionResult> Get(int video_id)
    {
        var fake_records = new List<Record>
        {
            new Record
            {
                Id = 1,
                VideoId = 1,
                UserId = 42,
                TranscriptLineId = 1,
                FilePath = "/uploads/recordings/user42_line1.webm",
                BlobData = null,
                Score = 87,
                DurationSeconds = 12,
                SttText = "This is a sample transcription from the user.",
                SttProviderKey = "google_stt_v1",
                CreatedAt = DateTime.UtcNow
            }
        };

        var transcript_lines = await _context.TranscriptLines
        .Where(x => x.VideoId == video_id)
        .Select(line => new
        {
            line.Id,
            line.VideoId,
            line.Text,
            line.ViText,
            line.Start,
            line.End,
            //Records = _context.Records
            //    .Where(r => r.TranscriptLineId == line.Id)
            //    .ToList()
            Records = fake_records
        })
        .ToListAsync();

        return Ok(transcript_lines);
    }
}


