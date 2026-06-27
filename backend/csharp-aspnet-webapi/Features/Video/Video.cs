using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("video")]
public class Video
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    // Foreign Key or Reference to the User (Admin is -1)
    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [StringLength(20)] // YouTube IDs are typically 11 characters
    [Column("youtube_id")]
    public required string YoutubeId { get; set; }

    [Required]
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("filename")]
    public string? Filename { get; set; }

    [Column("blob_data")]
    public byte[]? BlobData { get; set; }

    [Column("audio_filename")]
    public string? AudioFilename { get; set; }

    [Column("audio_blob_data")]
    public byte[]? AudioBlobData { get; set; }

    [Required]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("thumbnail")]
    public byte[]? Thumbnail { get; set; }

    [Column("thumbnail_file_name")]
    public string? ThumbnailFileName { get; set; }
}