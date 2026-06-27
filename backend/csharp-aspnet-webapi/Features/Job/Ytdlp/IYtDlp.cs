using static YtdlpUtils;

public interface IYtDlp
{
    Task<YtDlpResult<string>> GetTitleAsync(string youtubeLink);
    Task<YtDlpResult<byte[]>> GetThumbnailAsync(string youtubeLink);
    Task<YtDlpResult<string>> GetDescriptionAsync(string youtubeLink);
    Task<YtDlpResult<byte[]>> DownloadVideoAsync(string youtubeLink);
    Task<YtDlpResult<List<TranscriptLineFormat>>> FetchBuiltInTranscriptAsync(string youtubeLink);
    Task<YtDlpResult<byte[]>> DownloadAudioAsync(string youtubeLink);
}