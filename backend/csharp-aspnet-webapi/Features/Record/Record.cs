using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("record")]
public class Record
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("video_id")]
    public int VideoId { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("transcript_line_id")]
    public int TranscriptLineId { get; set; }

    [Column("file_path")]
    public string? FilePath { get; set; }

    [Column("blob_data")]
    public byte[]? BlobData { get; set; }

    [Range(0, 100)]
    [Column("score")]
    public int Score { get; set; }

    [Column("stt_text")]
    public string? SttText { get; set; }

    [Column("stt_provider_key")]
    public string? SttProviderKey { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}