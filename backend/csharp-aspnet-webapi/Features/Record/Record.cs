using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Record
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int VideoId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int TranscriptLineId { get; set; }

    public string? FilePath { get; set; }

    public byte[]? BlobData { get; set; }

    [Range(0, 100)]
    public int Score { get; set; }

    public int DurationSeconds { get; set; }

    public string? SttText { get; set; }

    public string? SttProviderKey { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}