using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class JobStep
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int JobId { get; set; }
    public required JobStepProcess Step { get; set; } // e.g., "DOWNLOAD", "ASR"
    public required JobStepStatus Status { get; set; }
    public string? ErrorMsg { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}