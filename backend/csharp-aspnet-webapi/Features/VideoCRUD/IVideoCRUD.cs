public interface IVideoCRUD
{
    Task CreateAsync(string id, string name, Stream videoStream);
    Task<VideoRecord> GetByIdAsync(string id);
    Task<List<VideoRecord>> SearchAsync(string? name = null, DateTime? from = null, DateTime? to = null);
    Task DeleteAsync(string id);
}