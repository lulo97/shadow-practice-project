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

        // WAV Header is 44 bytes
        byte[] header = new byte[44];
        await stream.ReadAsync(header, 0, 44);

        // Byte Rate is located at offset 28
        int byteRate = BitConverter.ToInt32(header, 28);

        // Subchunk2Size (Data Size) is located at offset 40
        int dataSize = BitConverter.ToInt32(header, 40);

        // Duration = DataSize / ByteRate
        int durationSeconds = dataSize / byteRate;

        // Reset the stream position
        stream.Position = 0;

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
            DurationSeconds = durationSeconds,
            SttProviderKey = _stt.GetKey()
        };

        _context.Records.Add(record);
        await _context.SaveChangesAsync();

        return Ok(new { message = $"New record id = {record.Id}" });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Record>> GetRecord(int id)
    {
        var record = await _context.Records.FindAsync(id);
        return record is null ? NotFound() : Ok(record);
    }
}

public class CreateRecordDto
{
    public required IFormFile File { get; set; }
    public int VideoId { get; set; }
    public int TranscriptLineId { get; set; }
}