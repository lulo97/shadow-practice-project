public class VideoUtilsYtdlp : BaseCliVideoUtils
{
    protected override string ExecutableName => "yt-dlp";

    protected override string BuildArguments(string link)
    {
        int h = 720;
        string ext = "mp4";
        
        // Dynamically build arguments using the custom settings
        return $"-f \"bestvideo[height={h}][ext={ext}]+bestaudio[ext=m4a]/best[height={h}][ext={ext}]\" -o - \"{link}\"";
    }
}
