public interface IAsrService
{
    /// <summary>
    /// Transcribes raw audio bytes and returns an SRT-formatted string.
    /// </summary>
    Task<List<YtdlpUtils.TranscriptLineFormat>> TranscribeAsync(byte[] audioBytes);
}