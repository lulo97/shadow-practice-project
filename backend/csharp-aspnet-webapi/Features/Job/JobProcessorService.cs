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
        while (!stoppingToken.IsCancellationRequested)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Find the oldest queued job
                var job = await dbContext.Jobs
                    .Where(j => j.Status == JobStatus.Queued)
                    .OrderBy(j => j.Id)
                    .FirstOrDefaultAsync(stoppingToken);

                if (job != null)
                {
                    await ProcessJobAsync(job, dbContext);
                }
            }

            // Wait 5 seconds before checking for new jobs to avoid slamming the CPU/DB
            await Task.Delay(5000, stoppingToken);
        }
    }

    private async Task ProcessJobAsync(Job job, AppDbContext db)
    {
        job.Status = JobStatus.Running;
        await db.SaveChangesAsync();

        var steps = await db.JobSteps
            .Where(s => s.JobId == job.Id)
            .OrderBy(s => s.Id)
            .ToListAsync();

        foreach (var step in steps)
        {
            // Execute logic based on step.Step
            // Update step.Status = "DONE" or "FAILED"
            await db.SaveChangesAsync();
        }

        job.Status = JobStatus.Done;
        await db.SaveChangesAsync();
    }
}