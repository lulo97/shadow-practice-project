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
            line.Skip,
            Records = _context.Records
                .Where(r => r.TranscriptLineId == line.Id)
                .Select(r => new
                {
                    r.Id,
                    r.SttText,
                    r.Score,
                    r.SttProviderKey,
                    r.CreatedAt
                })
                .ToList()
            //Records = fake_records
        })
        .ToListAsync();

        return Ok(transcript_lines);
    }

    [HttpPost("skip/{transcript_line_id}")]
    public async Task<IActionResult> Skip(int transcript_line_id)
    {
        var transcriptLine = await _context.TranscriptLines.FindAsync(transcript_line_id);

        if (transcriptLine == null)
        {
            return NotFound();
        }

        transcriptLine.Skip = transcriptLine.Skip == 0 ? 1 : 0;

        await _context.SaveChangesAsync();

        return Ok(transcriptLine);
    }

    [HttpPost("translate/{video_id}")]
    public async Task<IActionResult> Translate(int video_id, [FromBody] TranslateRequest request)
    {
        var (is_valid, message) = TranscriptUtils.ValidateViText(request.ViText);
        if (!is_valid)
            return BadRequest(new { message });

        var parsed_vi_text = TranscriptUtils.ParseViText(request.ViText);

        var transcriptLines = await _context.TranscriptLines
            .Where(x => x.VideoId == video_id)
            .OrderBy(x => x.LineIndex)
            .ToListAsync();

        if (transcriptLines.Count == 0)
            return NotFound(new { message = $"No transcript lines found for video {video_id}" });

        if (parsed_vi_text.Count != transcriptLines.Count)
            return BadRequest(new
            {
                message =
                $"Line count mismatch: got {parsed_vi_text.Count} translated lines " +
                $"but video has {transcriptLines.Count} transcript lines."
            });

        for (int i = 0; i < transcriptLines.Count; i++)
            transcriptLines[i].ViText = parsed_vi_text[i];

        await _context.SaveChangesAsync();

        return Ok(new { message = $"Saved {parsed_vi_text.Count} vi text lines" });
    }
}

public class TranslateRequest
{
    public string ViText { get; set; }
}


