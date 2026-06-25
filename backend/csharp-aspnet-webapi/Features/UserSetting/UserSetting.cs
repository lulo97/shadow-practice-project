using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

public class UserSetting
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [StringLength(100)]
    public string SttProviderKey { get; set; }

    [Range(0, 100)]
    public int Volume { get; set; }

    [Required]
    [StringLength(50)]
    public string RecordScreenUiStyle { get; set; }

    // Using int as requested (0 = off, 1 = on)
    [Range(0, 1)]
    public int Loop { get; set; }

    [Range(10, 90)]
    public int VideoWidthSize { get; set; }
}