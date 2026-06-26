using System;
using static System.Reflection.Metadata.BlobBuilder;
using Microsoft.Extensions.DependencyInjection; // Required for IServiceScopeFactory
public class VideoJobUtils
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IYtDlp _ytDlp;
    private readonly IAsrService _asrService;
    private readonly SseService _sse;

    public VideoJobUtils(IServiceScopeFactory scopeFactory, IYtDlp ytDlp, IAsrService asrService, SseService sse)
    {
        _scopeFactory = scopeFactory;
        _ytDlp = ytDlp;
        _asrService = asrService;
        _sse = sse;
    }

    public async Task Run(int jobId, string youtubeId, int videoId)
    {
        var scope = _scopeFactory.CreateScope();
        var _context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var link = $"https://youtube.com/watch?v={youtubeId}";
        var video = await _context.Videos.FindAsync(videoId);

        // ── Step 1: Fetch title ─────────────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Fetching video title"))
        {
            video.Title = await _ytDlp.GetTitleAsync(link);
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Title = {video.Title}");

        // ── Step 1.5: Fetch thumbnail ──────────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Fetching video thumbnail"))
        {
            video.Thumbnail = await _ytDlp.GetThumbnailAsync(link);
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Thumbnail = {video.Thumbnail.Length}");

        // ── Step 2: Fetch description ───────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Fetching video description"))
        {
            video.Description = await _ytDlp.GetDescriptionAsync(link);
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Description = {video.Description}");

        // ── Step 3: Download video ──────────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Downloading video at 720p"))
        {
            video.BlobData = await _ytDlp.DownloadVideoAsync(link);
            //video.Filename = $"{videoId}.mp4"; Implement file save instead of bytes in memory later
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video BlobData = {video.BlobData.Length}");

        // ── Step 4: Fetch built-in English transcript ───────────────────────────
        List<YtdlpUtils.TranscriptLineFormat> srtText = null;
        await using (var step = await BeginStep(jobId, "Checking for built-in English transcript"))
        {
            srtText = await _ytDlp.FetchBuiltInTranscriptAsync(link);
            await step.Complete(srtText != null
                ? "Found built-in transcript"
                : "No built-in transcript, will use ASR");
        }
        Console.WriteLine($"Video srtText = {srtText.Count}");

        // ── Step 5: Extract audio (only if no built-in transcript) ──────────────
        if (srtText == null || srtText.Count == 0)
        {
            byte[] audioBlobData;
            await using (var step = await BeginStep(jobId, "Extracting audio to MP3"))
            {
                audioBlobData = await _ytDlp.DownloadAudioAsync(link);
                await _context.SaveChangesAsync();
                await step.Complete();
            }
            Console.WriteLine($"audioBlobData = {audioBlobData.Length}");

            // ── Step 6: Transcribe audio ────────────────────────────────────────
            await using (var step = await BeginStep(jobId, "Transcribing audio with local ASR model"))
            {
                srtText = await _asrService.TranscribeAsync(video.BlobData!);
                await step.Complete();
            }
            Console.WriteLine($"srtText = {srtText.Count}");
        }

        // ── Step 7: Parse SRT and store transcript lines ────────────────────────
        await using (var step = await BeginStep(jobId, "Storing transcript lines"))
        {
            _context.TranscriptLines.AddRange(srtText.Select((b, i) => new TranscriptLine
            {
                VideoId = videoId,
                LineIndex = i,
                Text = b.Text,
                Start = b.Start,
                End = b.End,
                Skip = 0
            }));
            await _context.SaveChangesAsync();
            await step.Complete($"srtText {srtText.Count} lines");
        }

        await _sse.SendToFrontEnd("{\"message\":\"RESET_HOMEPAGE\"}");
    }

    private async Task<JobStepScope> BeginStep(int jobId, string stepName)
    {
        var scope = _scopeFactory.CreateScope();
        var _context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var step = new JobStep
        {
            JobId = jobId,
            StepName = stepName,
            Status = JobStepStatus.RUNNING,
            StartedAt = DateTime.UtcNow
        };
        _context.JobSteps.Add(step);
        await _context.SaveChangesAsync();
        return new JobStepScope(step, _context);
    }
}