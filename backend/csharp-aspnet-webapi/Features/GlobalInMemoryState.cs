using System.Collections.Generic;

public static class GlobalInMemoryState
{
    public static List<VideoRecord> Videos { get; set; } = new List<VideoRecord>();
}
