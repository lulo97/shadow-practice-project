public interface IVideoCRUD
{
    Task CreateAsync(string id, string title, Stream videoStream);
    Task<VideoRecord> GetByIdAsync(string id);
    Task<List<VideoRecord>> SearchAsync(string? title = null, DateTime? from = null, DateTime? to = null);
    Task DeleteAsync(string id);
}