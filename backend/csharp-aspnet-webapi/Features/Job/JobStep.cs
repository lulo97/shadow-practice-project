using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("job_step")]
public class JobStep
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Column("job_id")]
    public int JobId { get; set; }

    [Required]
    [Column("step_name")]
    public required string StepName { get; set; }   // "Downloading video at 720p" etc.

    [Required]
    [Column("status")]
    public required JobStepStatus Status { get; set; }

    [Column("note")]
    public string? Note { get; set; }               // optional detail shown to user

    [Column("error_msg")]
    public string? ErrorMsg { get; set; }

    [Column("started_at")]
    public DateTime? StartedAt { get; set; }

    [Column("ended_at")]
    public DateTime? EndedAt { get; set; }
}