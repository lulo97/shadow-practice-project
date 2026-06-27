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
    public string SttProviderKey { get; set; }


    // Using int as requested (0 = off, 1 = on)
    public int Loop { get; set; }

    public int VideoWidthSize { get; set; }
}