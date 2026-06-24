using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class TranscriptLine
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int VideoId { get; set; }

    [Required]
    public int LineIndex { get; set; }

    [Required]
    public string Text { get; set; } = string.Empty;

    public string? ViText { get; set; }

    [Required]
    public decimal Start { get; set; }

    [Required]
    public decimal End { get; set; }

    [Required]
    public int Skip { get; set; } = 0;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(VideoId))]
    public Video Video { get; set; } = null!;
}