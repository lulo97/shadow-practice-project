using static YtdlpUtils;

public interface IYtDlp
{
    Task<string> GetTitleAsync(string youtubeLink);
    Task<byte[]> GetThumbnailAsync(string youtubeLink);
    Task<string> GetDescriptionAsync(string youtubeLink);
    Task<byte[]> DownloadVideoAsync(string youtubeLink);
    Task<List<TranscriptLineFormat>> FetchBuiltInTranscriptAsync(string youtubeLink); 
    Task<byte[]> DownloadAudioAsync(string youtubeLink);
}