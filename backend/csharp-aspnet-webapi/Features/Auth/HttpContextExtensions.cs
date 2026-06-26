using Microsoft.EntityFrameworkCore;

public static class HttpContextExtensions
{
    public const string CookieName = "session_token";

    private static async Task<(User? User, AuthError? Error)> GetUserFromSessionAsync(
        HttpContext context,
        AppDbContext dbContext)
    {
        if (!context.Request.Cookies.TryGetValue(CookieName, out var token))
            return (null, AuthError.NotAuthenticated);

        var session = await dbContext.Sessions
            .FirstOrDefaultAsync(s => s.Token == token);

        if (session == null)
            return (null, AuthError.SessionInvalid);

        if (session.ExpiresAt < DateTime.UtcNow)
        {
            dbContext.Sessions.Remove(session);
            await dbContext.SaveChangesAsync();

            return (null, AuthError.SessionExpired);
        }

        var user = await dbContext.Users.FindAsync(session.UserId);

        return user == null
            ? (null, AuthError.UserNotFound)
            : (user, null);
    }


    public static async Task<(User? User, AuthError? Error)> GetUserFromCookieAsync(
        this HttpContext context,
        AppDbContext dbContext)
    {
        return await GetUserFromSessionAsync(context, dbContext);
    }


    public static async Task<(UserSetting? UserSetting, AuthError? Error)> GetSettingFromCookieAsync(
        this HttpContext context,
        AppDbContext dbContext)
    {
        var (user, error) = await GetUserFromSessionAsync(context, dbContext);

        if (error != null)
            return (null, error);

        var setting = await dbContext.UserSettings
            .FirstOrDefaultAsync(us => us.UserId == user!.Id);

        if (setting == null)
        {
            setting = new UserSetting
            {
                UserId = user!.Id,
                SttProviderKey = "WHISPER_CPP",
                Volume = 70,
                RecordScreenUiStyle = "ONE_SENTENCE",
                Loop = 0,
                VideoWidthSize = 50
            };
        }

        return (setting, null);
    }
}