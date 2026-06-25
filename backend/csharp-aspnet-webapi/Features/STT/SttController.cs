using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class SttController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ISTT _stt;

    public SttController(AppDbContext context, ISTT stt)
    {
        _context = context;
        _stt = stt;
    }

    [HttpPost("")]
    public async Task<IActionResult> Post(IFormFile file)
    {
        using var ms = new MemoryStream();
        await file.CopyToAsync(ms);
        var sttText = await _stt.RunAsync(ms.ToArray());
        return Ok(new { sttText });
    }
}

