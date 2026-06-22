
public class VideoCRUDInMemory : IVideoCRUD
{
    async public Task CreateAsync(string id, string title, Stream videoStream)
    {
        using (MemoryStream ms = new())
        {
            await videoStream.CopyToAsync(ms);
            VideoRecord data = new(Id: id, Title: title, Bytes: ms.ToArray());
            GlobalInMemoryState.Videos.Add(data);
        }
    }

    public Task DeleteAsync(string id)
    {
        var video = GlobalInMemoryState.Videos.FirstOrDefault(v => v.Id == id);

        if (video == null)
        {
            throw new KeyNotFoundException($"Video with ID {id} was not found.");
        }

        GlobalInMemoryState.Videos.Remove(video);

        return Task.CompletedTask;
    }

    public Task<VideoRecord> GetByIdAsync(string id)
    {
        var video = GlobalInMemoryState.Videos.FirstOrDefault(v => v.Id == id);

        if (video == null)
        {
            throw new KeyNotFoundException($"Video with ID {id} was not found.");
        }

        return Task.FromResult(video);
    }

    public Task<List<VideoRecord>> SearchAsync(string? title = null, DateTime? from = null, DateTime? to = null)
    {
        var query = GlobalInMemoryState.Videos.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(title))
        {
            query = query.Where(v => v.Title.Contains(title, StringComparison.OrdinalIgnoreCase));
        }

        if (from.HasValue)
        {
            query = query.Where(v => v.CreatedAt >= from.Value);
        }

        if (to.HasValue)
        {
            query = query.Where(v => v.CreatedAt <= to.Value);
        }

        return Task.FromResult(query.ToList());
    }
}