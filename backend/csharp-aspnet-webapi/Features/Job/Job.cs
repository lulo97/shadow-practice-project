using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Job
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int UserId { get; set; }
    public int VideoId { get; set; }
    public required JobStatus Status { get; set; } //QUEUED, RUNNING, DONE, FAILED
    public required JobType Type { get; set; } //VIDEO_INGEST or TRANSLATION
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

