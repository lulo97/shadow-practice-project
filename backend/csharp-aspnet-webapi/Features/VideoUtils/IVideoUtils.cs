using System.IO;

public interface IVideoUtils
{
    //This can be implemented as cli tool or http call
    Stream LinkToVideo(string link);
}