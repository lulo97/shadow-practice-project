using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ISTT _stt;
    public RecordsController(AppDbContext context, ISTT stt)
    {
        _context = context; _stt = stt;
    }

    [HttpPost]
    public async Task<ActionResult<Record>> CreateRecord([FromForm] CreateRecordDto dto)
    {
        using var stream = dto.File.OpenReadStream();

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();
        var sttText = await _stt.RunAsync(bytes);

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return BadRequest(new { message = error });
        }

        var transcript_line = await _context.TranscriptLines.FirstOrDefaultAsync(x => x.Id == dto.TranscriptLineId);

        if (transcript_line == null)
        {
            return NotFound(new { message = "TranscriptLineId" });
        }

        var record = new Record
        {
            VideoId = dto.VideoId,
            TranscriptLineId = dto.TranscriptLineId,
            SttText = sttText,
            UserId = user.Id,
            FilePath = null,
            BlobData = bytes, //For test
            Score = SttUtils.GetScore(transcript_line.Text, sttText),
            SttProviderKey = _stt.GetKey()
        };

        _context.Records.Add(record);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"New record id = {record.Id}" });
    }

    [HttpGet("metadata/{id}")]
    public async Task<ActionResult> GetMetadata(int id)
    {
        var record = await _context.Records.FindAsync(id);

        if (record == null)
        {
            return NotFound();
        }

        var record_dto = new
        {
            record.Id,
            record.FilePath,
            record.TranscriptLineId,
            record.SttProviderKey,
            record.SttText,
            record.CreatedAt
        };

        return Ok(record_dto);
    }

    [HttpGet("file/{id}")]
    public async Task<ActionResult> GetFile(int id)
    {
        var record = await _context.Records.FindAsync(id);

        if (record == null)
        {
            return NotFound();
        }

        var blob_data = record.BlobData;

        if (blob_data == null)
        {
            return NoContent();
        }

        return File(blob_data, "audio/wav", $"{id}.wav");
    }
}

public class CreateRecordDto
{
    public required IFormFile File { get; set; }
    public int VideoId { get; set; }
    public int TranscriptLineId { get; set; }
}