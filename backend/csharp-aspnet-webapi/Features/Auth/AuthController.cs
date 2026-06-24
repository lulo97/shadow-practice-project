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
        if (!Request.Cookies.TryGetValue(CookieName, out var token))
        {
            return Unauthorized(new { message = "Not authenticated" });
        }

        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.token == token);

        if (session == null || session.expires_at < DateTime.UtcNow)
        {
            //Clean up if found expires row
            if (session != null)
            {
                _context.Sessions.Remove(session);
                await _context.SaveChangesAsync();
            }
            return Unauthorized(new { message = "Session expired or invalid" });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.id == session.user_id);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        return Ok(new { user.id, user.username, user.created_at });
    }

    [HttpPost("signup")]
    public async Task<IActionResult> SignUp([FromBody] AuthRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Username and password are required." });
        }

        var userExists = await _context.Users.AnyAsync(u => u.username == request.Username);
        if (userExists)
        {
            return BadRequest(new { message = "Username is already taken." });
        }

        var newUser = new User
        {
            username = request.Username,
            password_hashed = HashUtils.HashPassword(request.Password),
            created_at = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration successful" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> LogIn([FromBody] AuthRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.username == request.Username);
        if (user == null || !HashUtils.Verify(request.Password, user.password_hashed))
        {
            return Unauthorized(new { message = "Invalid username or password." });
        }

        var token = Utils.GetStrongToken();

        var session = new Session
        {
            user_id = user.id,
            token = token,
            created_at = DateTime.UtcNow,
            expires_at = DateTime.UtcNow.AddDays(ExpiresDay)
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = session.expires_at
        };

        Response.Cookies.Append(CookieName, token, cookieOptions);

        return Ok(new { message = "Login successful", user = new { user.id, user.username } });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> LogOut()
    {
        if (Request.Cookies.TryGetValue(CookieName, out var token))
        {
            var session = await _context.Sessions.FirstOrDefaultAsync(s => s.token == token);
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