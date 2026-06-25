using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Job> Jobs { get; set; }
    public DbSet<JobStep> JobSteps { get; set; }
    public DbSet<Video> Videos { get; set; }
    public DbSet<TranscriptLine> TranscriptLines { get; set; }
    public DbSet<Record> Records { get; set; }
}