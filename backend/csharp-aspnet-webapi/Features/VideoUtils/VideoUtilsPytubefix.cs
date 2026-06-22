public class VideoUtilsPytubefix : BaseCliVideoUtils
{
    protected override string ExecutableName => "python";

    protected override string BuildArguments(string link)
    {
        // Python inline script to fetch stream and write directly to stdout buffer
        string pythonCode = "import sys; from pytubefix import YouTube; " +
                            $"yt = YouTube('{link}'); " +
                            "stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first(); " +
                            "stream.stream_to_buffer(sys.stdout.buffer)";
        
        return $"-c \"{pythonCode}\"";
    }
}
