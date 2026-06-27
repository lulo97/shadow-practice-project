public class VideoLocalFileReader : IVideoFileReader
{
    private readonly string _basePath = Utils.LOCAL_FILE_PATH;

    private async Task<byte[]?> ReadFileAsync(string? fileName)
    {
        if (string.IsNullOrEmpty(fileName))
            return null;

        string fullPath = Path.Combine(_basePath, fileName);

        if (!File.Exists(fullPath))
            return null;

        return await File.ReadAllBytesAsync(fullPath);
    }

    public Task<byte[]?> ReadVideoAsync(Video video) => ReadFileAsync(video.Filename);
    public Task<byte[]?> ReadThumbnailAsync(Video video) => ReadFileAsync(video.ThumbnailFileName);
    public Task<byte[]?> ReadAudioAsync(Video video) => ReadFileAsync(video.AudioFilename);
}