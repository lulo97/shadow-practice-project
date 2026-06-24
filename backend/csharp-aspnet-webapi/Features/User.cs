public class User
{
    public int id { get; set; }
    public required string username { get; set; }
    public required string password_hashed { get; set; }
    public DateTime created_at { get; set; }
}
