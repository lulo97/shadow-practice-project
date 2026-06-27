using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata;

[ApiController]
[Route("api/[controller]")]
public class RecordsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ISTTFactory _sttFactory;
    public RecordsController(AppDbContext context, ISTTFactory sttFactory)
    {
        _context = context; _sttFactory = sttFactory;
    }

    [HttpPost]
    public async Task<ActionResult<Record>> CreateRecord([FromForm] CreateRecordDto dto)
    {
        using var stream = dto.File.OpenReadStream();

        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        var bytes = memoryStream.ToArray();

        if (bytes == null || bytes.Length <= 1024)
        {
            //Handle file invalid as dummy wav file
            string dummyPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Assets\dummy.wav";

            if (System.IO.File.Exists(dummyPath))
            {
                bytes = await System.IO.File.ReadAllBytesAsync(dummyPath);
            }
            else
            {
                // Fallback if the file isn't found on that specific path
                return BadRequest("Uploaded file is invalid, and system dummy file was not found.");
            }
        }

        var (user_setting, error) = await HttpContext.GetSettingFromCookieAsync(_context);

        if (user_setting == null)
        {
            return BadRequest(new { message = error });
        }

        var stt = _sttFactory.GetSTT(user_setting);

        var sttText = await stt.RunAsync(bytes);

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
            UserId = user_setting.Id,
            FilePath = null,
            BlobData = bytes, //For test
            Score = SttUtils.GetScore(transcript_line.Text, sttText),
            SttProviderKey = stt.GetKey()
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

    [HttpGet("transcript-line/{transcript_line_id}")]
    public async Task<ActionResult> GetRecordsFromTranscriptLineId(int transcript_line_id)
    {
        var records = await _context.Records.Where(r => r.TranscriptLineId == transcript_line_id).ToListAsync();
        return Ok(records);
    }
}

public class CreateRecordDto
{
    public required IFormFile File { get; set; }
    public int VideoId { get; set; }
    public int TranscriptLineId { get; set; }
}