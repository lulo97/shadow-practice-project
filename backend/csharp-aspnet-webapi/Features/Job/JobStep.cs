using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class JobStep
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public int JobId { get; set; }
    public required string StepName { get; set; }   // "Downloading video at 720p" etc.
    public required JobStepStatus Status { get; set; }
    public string? Note { get; set; }               // optional detail shown to user
    public string? ErrorMsg { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
}