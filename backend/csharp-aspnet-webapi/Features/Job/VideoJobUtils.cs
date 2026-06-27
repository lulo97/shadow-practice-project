using static YtdlpUtils;

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
        var _videoWrite = scope.ServiceProvider.GetRequiredService<IVideoFileWriter>();

        var link = $"https://youtube.com/watch?v={youtubeId}";
        var video = await _context.Videos.FindAsync(videoId);

        if (video == null)
        {
            throw new Exception("Video must not be null here");
        }

        // ── Step 1: Fetch title ─────────────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Fetching video title"))
        {
            var ytDlpResult = await _ytDlp.GetTitleAsync(link);

            if (!ytDlpResult.Success || ytDlpResult.Data == null)
            {
                await step.Fail(ytDlpResult.Error ?? "Error");
                throw new Exception($"Video save failed: {ytDlpResult.Error}");
            }

            video.Title = ytDlpResult.Data;
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Title = {video.Title}");

        // ── Step 1.5: Fetch thumbnail ──────────────────────────────────────────────
        byte[] thumbnailByte = null;
        await using (var step = await BeginStep(jobId, "Fetching video thumbnail"))
        {
            var ytDlpResult = await _ytDlp.GetThumbnailAsync(link);

            if (!ytDlpResult.Success || ytDlpResult.Data == null)
            {
                await step.Fail(ytDlpResult.Error ?? "Error");
                throw new Exception(ytDlpResult.Error);
            }

            thumbnailByte = ytDlpResult.Data;

            var (data, error) = await _videoWrite.WriteThumbnailAsync(video.Id, _context, thumbnailByte);

            if (error != null)
            {
                await step.Fail($"Failed to save video: {error}");
                throw new Exception($"Video save failed: {error}");
            }

            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Thumbnail = {thumbnailByte.Length}");

        // ── Step 2: Fetch description ───────────────────────────────────────────
        await using (var step = await BeginStep(jobId, "Fetching video description"))
        {
            var ytDlpResult = await _ytDlp.GetDescriptionAsync(link);

            if (!ytDlpResult.Success || ytDlpResult.Data == null)
            {
                await step.Fail(ytDlpResult.Error ?? "Error");
                throw new Exception(ytDlpResult.Error);
            }

            video.Description = ytDlpResult.Data;
            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video Description = {video.Description}");

        // ── Step 3: Download video ──────────────────────────────────────────────
        byte[] videoBlobData = null;
        await using (var step = await BeginStep(jobId, "Downloading video"))
        {
            
            var ytDlpResult = await _ytDlp.DownloadVideoAsync(link);

            if (!ytDlpResult.Success || ytDlpResult.Data == null)
            {
                await step.Fail(ytDlpResult.Error ?? "Error");
                throw new Exception(ytDlpResult.Error);
            }

            videoBlobData = ytDlpResult.Data;

            var (data, error) = await _videoWrite.WriteVideoAsync(video.Id, _context, videoBlobData);

            if (error != null)
            {
                await step.Fail($"Failed to save video: {error}");
                throw new Exception($"Video save failed: {error}");
            }

            await _context.SaveChangesAsync();
            await step.Complete();
        }
        Console.WriteLine($"Video BlobData = {videoBlobData.Length}");

        // ── Step 4: Fetch built-in English transcript ───────────────────────────
        List<YtdlpUtils.TranscriptLineFormat> srtText = null;
        await using (var step = await BeginStep(jobId, "Checking for built-in English transcript"))
        {
            var ytDlpResult = await _ytDlp.FetchBuiltInTranscriptAsync(link);

            if (!ytDlpResult.Success || ytDlpResult.Data == null)
            {
                await step.Fail(ytDlpResult.Error ?? "Error");
                throw new Exception(ytDlpResult.Error);
            }

            srtText = ytDlpResult.Data;

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
                var ytDlpResult = await _ytDlp.DownloadAudioAsync(link);

                if (!ytDlpResult.Success || ytDlpResult.Data == null)
                {
                    await step.Fail(ytDlpResult.Error ?? "Error");
                    throw new Exception(ytDlpResult.Error);
                }

                audioBlobData = ytDlpResult.Data;

                var (data, error) = await _videoWrite.WriteAudioAsync(video.Id, _context, audioBlobData);

                if (error != null)
                {
                    await step.Fail($"Failed to save video: {error}");
                    throw new Exception($"Video save failed: {error}");
                }

                await _context.SaveChangesAsync();
                await step.Complete();
            }
            Console.WriteLine($"audioBlobData = {audioBlobData.Length}");

            // ── Step 6: Transcribe audio ────────────────────────────────────────
            await using (var step = await BeginStep(jobId, "Transcribing audio with local ASR model"))
            {
                srtText = await _asrService.TranscribeAsync(audioBlobData!);
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