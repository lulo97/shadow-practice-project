using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("v1/[controller]")]
public class VideosController : ControllerBase
{
    private readonly IVideoUtils _videoUtils;
    private readonly IVideoCRUD _videoCrud;

    public VideosController(IVideoUtils videoUtils, IVideoCRUD videoCrud)
    {
        _videoUtils = videoUtils;
        _videoCrud = videoCrud;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVideoRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Link))
        {
            return BadRequest(new { message = "Id, Title, and Link are required fields." });
        }

        using VideoStreamResult videoResult = _videoUtils.LinkToVideo(request.Link);
        using Stream videoStream = videoResult.Stream;

        await _videoCrud.CreateAsync(videoResult.Id, videoResult.Title, videoStream);

        return Ok(new { message = $"Video successfully downloaded and stored" });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        try
        {
            VideoRecord video = await _videoCrud.GetByIdAsync(id);
            return File(video.Bytes, "video/mp4");
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Video with ID '{id}' was not found." });
        }
    }

    [HttpGet("{id}/metadata")]
    public async Task<IActionResult> GetMetadata(string id)
    {
        try
        {
            VideoRecord video = await _videoCrud.GetByIdAsync(id);
            return Ok(new { video.Id, video.Title, video.CreatedAt });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Video with ID '{id}' was not found." });
        }
    }

    [HttpGet]
    public async Task<IActionResult> Search(
    [FromQuery] string? title,
    [FromQuery] DateTime? from,
    [FromQuery] DateTime? to)
    {
        List<VideoRecord> results = await _videoCrud.SearchAsync(title, from, to);
        return Ok(results.Select(v => new { v.Id, v.Title, v.CreatedAt }));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {

        await _videoCrud.DeleteAsync(id);
        return NoContent();
    }
}