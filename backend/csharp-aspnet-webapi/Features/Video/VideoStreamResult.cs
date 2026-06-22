public class VideoStreamResult : IDisposable
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public Stream Stream { get; set; } = Stream.Null;

    //Declare Dispose() for stream data of current class
    //Other places can do "using VideoStreamResult..."
    //Not using "using..." can cause CLI zombie process
    public void Dispose()
    {
        Stream?.Dispose();
    }
}