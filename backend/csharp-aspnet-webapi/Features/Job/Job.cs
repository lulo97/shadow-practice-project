using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("job")]
public class Job
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("video_id")]
    public int VideoId { get; set; }

    [Required]
    [Column("status")]
    public required JobStatus Status { get; set; } //QUEUED, RUNNING, DONE, FAILED

    [Required]
    [Column("type")]
    public required JobType Type { get; set; } //VIDEO_INGEST or TRANSLATION

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}