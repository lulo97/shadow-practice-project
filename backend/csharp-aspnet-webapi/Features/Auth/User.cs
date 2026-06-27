using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

//The error 42P01: relation "user" does not exist occurs because PostgreSQL treats "user" as a reserved keyword.
[Table("users")]
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [Column("username")]
    public required string Username { get; set; }

    [Required]
    [Column("password_hashed")]
    public required string PasswordHashed { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; }
}