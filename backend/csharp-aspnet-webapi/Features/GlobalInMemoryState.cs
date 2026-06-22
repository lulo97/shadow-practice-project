using System.Collections.Generic;

public class VideoRecord
{
    public string Id { get; set; } = string.Empty;
    public byte[] Bytes { get; set; } = System.Array.Empty<byte>();
    public string Title { get; set; } = string.Empty;
}

public static class GlobalInMemoryState
{
    public static List<VideoRecord> Videos { get; set; } = new List<VideoRecord>();
}
