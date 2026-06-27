using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table("user_setting")]
public class UserSetting
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("user_id")]
    public int UserId { get; set; }

    [Required]
    [Column("stt_provider_key")]
    public required string SttProviderKey { get; set; }

    // Using int as requested (0 = off, 1 = on)
    [Column("loop")]
    public int Loop { get; set; }

    [Column("video_width_size")]
    public int VideoWidthSize { get; set; }
}