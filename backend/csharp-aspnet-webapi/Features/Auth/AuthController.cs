using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private const string CookieName = "session_token";
    private const int ExpiresDay = 7;

    public AuthController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (error.HasValue)
        {
            return error switch
            {
                AuthError.UserNotFound => NotFound(new { message = "User not found" }),
                _ => Unauthorized(new { message = error.ToString() })
            };
        }

        return Ok(new { user!.Id, user.Username, user.CreatedAt });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var userExists = await _context.Users.AnyAsync(u => u.Username == request.Username);
        if (userExists)
        {
            return BadRequest(new { message = "Username is already taken." });
        }

        var newUser = new User
        {
            Username = request.Username,
            PasswordHashed = HashUtils.HashPassword(request.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration successful" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> LogIn([FromBody] AuthRequest request)
    {
        int totalUsers = await _context.Users.CountAsync();

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !HashUtils.Verify(request.Password, user.PasswordHashed))
        {
            return Unauthorized(new { message = "Invalid Username or password." });
        }

        var Token = Utils.GetStrongToken();

        var session = new Session
        {
            UserId = user.Id,
            Token = Token,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(ExpiresDay)
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = session.ExpiresAt
        };

        Response.Cookies.Append(CookieName, Token, cookieOptions);

        return Ok(new { message = "Login successful", user = new { user.Id, user.Username } });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> LogOut()
    {
        if (Request.Cookies.TryGetValue(CookieName, out var Token))
        {
            var session = await _context.Sessions.FirstOrDefaultAsync(s => s.Token == Token);
            if (session != null)
            {
                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync();
            }

            Response.Cookies.Delete(CookieName);
        }

        return Ok(new { message = "Logged out successfully" });
    }
}