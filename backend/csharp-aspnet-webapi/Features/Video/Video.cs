using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class Video
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    // Foreign Key or Reference to the User (Admin is -1)
    [Required]
    public int UserId { get; set; }

    [Required]
    [StringLength(20)] // YouTube IDs are typically 11 characters
    public required string YoutubeId { get; set; }

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? Filename { get; set; }

    public byte[]? BlobData { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
    public ICollection<TranscriptLine> TranscriptLines { get; set; } = [];
}