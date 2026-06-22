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
    public async Task<IActionResult> POST([FromBody] CreateVideoRequest request)
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
}