using System;
using System.Linq;
using System.Web;

public static class YoutubeUtils
{
    public static (bool isValid, string message) IsValid(string url)
    {
        // 1. Check for null or empty
        if (string.IsNullOrWhiteSpace(url))
            return (false, "URL cannot be empty.");

        // 2. Validate URI format
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
            return (false, "URL is not a valid absolute URI.");

        // 3. Validate Domain
        if (uri.Host != "www.youtube.com" && uri.Host != "youtube.com")
            return (false, "Domain must be youtube.com or www.youtube.com.");

        // 4. Validate Path
        if (uri.AbsolutePath != "/watch")
            return (false, "Path must be /watch.");

        return (true, "Valid YouTube URL.");
    }

    public static string? GetVideoId(string url)
    {
        var (valid, valid_message) = IsValid(url);

        if (!valid) return null;

        var uri = new Uri(url);
        var query = HttpUtility.ParseQueryString(uri.Query);

        return query.Get("v");
    }
}