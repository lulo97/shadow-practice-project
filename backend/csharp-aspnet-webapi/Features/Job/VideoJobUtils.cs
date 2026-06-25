using System;
using static System.Reflection.Metadata.BlobBuilder;

public class VideoJobUtils
{
    private readonly AppDbContext _context;
    private readonly IYtDlp _ytDlp;
    private readonly IAsrService _asrService;

    public VideoJobUtils(AppDbContext context, IYtDlp ytDlp, IAsrService asrService)
    {
        _context = context;
        _ytDlp = ytDlp;
        _asrService = asrService;
    }

    public async Task Run(int jobId, string youtubeId, int videoId)
    {
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
    }

    private async Task<JobStepScope> BeginStep(int jobId, string stepName)
    {
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

    private record SrtBlock(string Text, decimal Start, decimal End);

    private List<SrtBlock> ParseSrtBlocks(string srt)
    {
        var blocks = new List<SrtBlock>();

        // Split on blank lines — each SRT block is: index \n timestamps \n text(s)
        var rawBlocks = srt.Split(
            new[] { "\r\n\r\n", "\n\n" },
            StringSplitOptions.RemoveEmptyEntries);

        foreach (var raw in rawBlocks)
        {
            var lines = raw.Split(
                new[] { "\r\n", "\n" },
                StringSplitOptions.RemoveEmptyEntries);

            if (lines.Length < 3) continue;                // need index + timestamps + text

            // lines[0] = block index (skip), lines[1] = timestamp range, lines[2..] = text
            if (!TryParseTimestampLine(lines[1], out var start, out var end)) continue;

            var text = string.Join(" ", lines[2..]).Trim();
            if (text.Length == 0) continue;

            blocks.Add(new SrtBlock(text, start, end));
        }

        return blocks;
    }

    /// <summary>Parses "00:00:01,000 --> 00:00:04,500" into decimal seconds.</summary>
    private static bool TryParseTimestampLine(
        string line, out decimal start, out decimal end)
    {
        start = end = 0;

        var parts = line.Split("-->", StringSplitOptions.TrimEntries);
        if (parts.Length != 2) return false;

        return TryParseTimestamp(parts[0], out start)
            && TryParseTimestamp(parts[1], out end);
    }

    /// <summary>Converts "hh:mm:ss,mmm" to total seconds as decimal.</summary>
    private static bool TryParseTimestamp(string ts, out decimal seconds)
    {
        seconds = 0;
        // Normalise comma separator used in SRT (WebVTT uses a dot)
        ts = ts.Replace(',', '.');

        if (!TimeSpan.TryParseExact(ts, @"hh\:mm\:ss\.fff", null, out var span))
            return false;

        seconds = (decimal)span.TotalSeconds;
        return true;
    }
}