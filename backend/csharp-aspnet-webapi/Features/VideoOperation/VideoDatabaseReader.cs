public class VideoDatabaseReader : IVideoFileReader
{
    public Task<byte[]?> ReadVideoAsync(Video video)
    {
        if (video.BlobData == null || video.BlobData.Length == 0)
            return Task.FromResult<byte[]?>(null);

        return Task.FromResult<byte[]?>(video.BlobData);
    }

    public Task<byte[]?> ReadThumbnailAsync(Video video)
    {
        if (video.Thumbnail == null || video.Thumbnail.Length == 0)
            return Task.FromResult<byte[]?>(null);

        return Task.FromResult<byte[]?>(video.Thumbnail);
    }

    public Task<byte[]?> ReadAudioAsync(Video video)
    {
        if (video.AudioBlobData == null || video.AudioBlobData.Length == 0)
            return Task.FromResult<byte[]?>(null);

        return Task.FromResult<byte[]?>(video.AudioBlobData);
    }
}