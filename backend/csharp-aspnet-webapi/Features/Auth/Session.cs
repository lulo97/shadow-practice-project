public class Session
{
    public int id { get; set; }
    public required int user_id { get; set; }
    public required string token { get; set; }
    public DateTime created_at { get; set; }
    public DateTime expires_at { get; set; }
}
