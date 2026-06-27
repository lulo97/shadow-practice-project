public interface IVideoFileReader
{
    Task<byte[]?> ReadVideoAsync(Video video);
    Task<byte[]?> ReadThumbnailAsync(Video video);
    Task<byte[]?> ReadAudioAsync(Video video);
}