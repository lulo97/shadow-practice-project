using Microsoft.EntityFrameworkCore;

public static class HttpContextExtensions
{
    public const string CookieName = "session_token";

    public static async Task<(User? User, AuthError? Error)> GetUserFromCookieAsync(this HttpContext context, AppDbContext dbContext)
    {
        if (!context.Request.Cookies.TryGetValue(CookieName, out var Token))
            return (null, AuthError.NotAuthenticated);

        var session = await dbContext.Sessions.FirstOrDefaultAsync(s => s.Token == Token);

        if (session == null)
            return (null, AuthError.SessionInvalid);

        if (session.ExpiresAt < DateTime.UtcNow)
        {
            dbContext.Sessions.Remove(session);
            await dbContext.SaveChangesAsync();
            return (null, AuthError.SessionExpired);
        }

        var user = await dbContext.Users.FindAsync(session.UserId);

        return user == null ? (null, AuthError.UserNotFound) : (user, null);
    }
}