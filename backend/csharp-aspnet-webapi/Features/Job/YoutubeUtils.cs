using System;
using System.Linq;
using System.Web;

public static class YoutubeUtils
{
    public static bool IsValid(string url)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;

        return Uri.TryCreate(url, UriKind.Absolute, out var uri) &&
               (uri.Host == "www.youtube.com" || uri.Host == "youtube.com") &&
               uri.AbsolutePath == "/watch";
    }

    public static string? GetVideoId(string url)
    {
        if (!IsValid(url)) return null;

        var uri = new Uri(url);
        var query = HttpUtility.ParseQueryString(uri.Query);

        return query.Get("v");
    }
}