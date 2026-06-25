using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class TranscriptsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILLM _llm;

    public TranscriptsController(AppDbContext context, ILLM llm)
    {
        _context = context;
        _llm = llm;
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
        if (transcriptLine == null) return NotFound();

        transcriptLine.Skip = transcriptLine.Skip == 0 ? 1 : 0;
        await _context.SaveChangesAsync();
        return Ok(transcriptLine);
    }

    [HttpPost("translate/{video_id}")]
    public async Task<IActionResult> Translate(int video_id, [FromBody] TranslateRequest request)
    {
        var parsed = TranscriptUtils.ParseViText(request.ViText);
        var (isValid, message) = TranscriptUtils.ValidateViText(request.ViText);

        if (!isValid) return BadRequest(new { message });

        return await UpdateViTextAsync(video_id, parsed);
    }

    [HttpGet("llm/{video_id}")]
    public async Task<IActionResult> LLM(int video_id)
    {
        var lines = await _context.TranscriptLines.Where(x => x.VideoId == video_id).ToListAsync();
        var output = await _llm.RunAsync(TranscriptUtils.BuildTranscriptForLlm(lines));

        var (isValid, message) = TranscriptUtils.ValidateViText(output);
        if (!isValid) return BadRequest(new { message });

        return await UpdateViTextAsync(video_id, TranscriptUtils.ParseViText(output), "Auto saved");
    }

    private async Task<IActionResult> UpdateViTextAsync(int videoId, List<string> parsedViText, string actionName = "Saved")
    {
        var transcriptLines = await _context.TranscriptLines
            .Where(x => x.VideoId == videoId)
            .OrderBy(x => x.LineIndex)
            .ToListAsync();

        if (transcriptLines.Count == 0)
            return NotFound(new { message = $"No transcript lines found for video {videoId}" });

        if (parsedViText.Count != transcriptLines.Count)
            return BadRequest(new { message = $"Line count mismatch: got {parsedViText.Count} lines but video has {transcriptLines.Count}." });

        for (int i = 0; i < transcriptLines.Count; i++)
        {
            transcriptLines[i].ViText = parsedViText[i];
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = $"{actionName} {parsedViText.Count} vi text lines" });
    }
}


