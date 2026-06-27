using static VideosController;

public record VideoListFilter(
    string? Title,
    DateTime? FromDate,
    DateTime? ToDate,
    string? VideoType
);

public interface IVideoRepository
{
    Task<List<VideoHomepageDto>> GetListAsync(int userId, VideoListFilter filter);
}