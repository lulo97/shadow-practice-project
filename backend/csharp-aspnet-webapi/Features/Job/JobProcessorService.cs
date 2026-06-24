using Microsoft.EntityFrameworkCore;

public class JobProcessorService : BackgroundService
{
    //Can't inject context directly 
    //Using IServiceScopeFactory to dispose context correctly
    private readonly IServiceScopeFactory _scopeFactory;

    public JobProcessorService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine($"[Background Service] Starting on Thread ID: {Environment.CurrentManagedThreadId}");

        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var videoJobUtils = scope.ServiceProvider.GetRequiredService<VideoJobUtils>();

                // Find the oldest queued job
                var job = await dbContext.Jobs
                    .Where(j => j.Status == JobStatus.Queued)
                    .OrderBy(j => j.Id)
                    .FirstOrDefaultAsync(stoppingToken);

                if (job != null)
                {
                    Console.WriteLine($"[Background Service] Processing job {job.Id} on Thread ID: {Environment.CurrentManagedThreadId}");
                    await ProcessJobAsync(job, dbContext, videoJobUtils);
                }
            }

            // Wait 5 seconds before checking for new jobs to avoid slamming the CPU/DB
            await Task.Delay(5000, stoppingToken);
        }
    }

    private async Task ProcessJobAsync(Job job, AppDbContext db, VideoJobUtils videoJobUtils)
    {
        job.Status = JobStatus.Running;
        await db.SaveChangesAsync();

        var video = await db.Videos.FindAsync(job.VideoId);

        try
        {
            if (job.Type == JobType.VideoIngest)
                await videoJobUtils.Run(job.Id, video.YoutubeId, job.VideoId);

            job.Status = JobStatus.Done;
        }
        catch (Exception ex)
        {
            job.Status = JobStatus.Failed;
            Console.WriteLine($"[Job {job.Id}] Failed: {ex.Message}");
        }

        await db.SaveChangesAsync();
    }
}