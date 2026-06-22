public class VideoRecord
{
    public VideoRecord(string Id, byte[] Bytes, string Title)
    {
        this.Id = Id;
        this.Bytes = Bytes;
        this.Title = Title;
    }

    public string Id { get; set; } = string.Empty;
    public byte[] Bytes { get; set; } = System.Array.Empty<byte>();
    public string Title { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = new DateTime();
}