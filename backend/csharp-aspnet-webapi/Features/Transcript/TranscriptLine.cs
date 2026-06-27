using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("transcript_line")]
public class TranscriptLine
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("video_id")]
    public int VideoId { get; set; }

    [Required]
    [Column("line_index")]
    public int LineIndex { get; set; }

    [Required]
    [Column("text")]
    public string Text { get; set; } = string.Empty;

    [Column("vi_text")]
    public string? ViText { get; set; }

    [Required]
    [Column("start")]
    public decimal Start { get; set; }

    [Required]
    [Column("end")]
    public decimal End { get; set; }

    [Required]
    [Column("skip")]
    public int Skip { get; set; } = 0;

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}