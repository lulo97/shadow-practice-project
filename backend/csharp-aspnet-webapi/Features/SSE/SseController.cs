using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class SseController : ControllerBase
{
    private readonly SseService _sseService;

    public SseController(SseService sseService)
    {
        _sseService = sseService;
    }

    [HttpGet("stream")]
    public async Task Stream(CancellationToken ct)
    {
        var clientId = Guid.NewGuid().ToString();

        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";
        Response.Headers["Connection"] = "keep-alive";
        Response.Headers["Access-Control-Allow-Origin"] = "*";

        var writer = new StreamWriter(Response.Body);
        _sseService.Register(clientId, writer);

        // Send a "connected" ping immediately
        await writer.WriteLineAsync("data: {\"type\":\"connected\"}");
        await writer.WriteLineAsync();
        await writer.FlushAsync();

        // Keep connection open until client disconnects
        try { await Task.Delay(Timeout.Infinite, ct); }
        catch (TaskCanceledException) { }
        finally { _sseService.Unregister(clientId); }
    }
}