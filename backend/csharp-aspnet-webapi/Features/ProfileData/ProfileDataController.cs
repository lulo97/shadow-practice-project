using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class ProfileDataController : ControllerBase
{
    private readonly IProfileDataService _profileDataService;
    private readonly AppDbContext _context;

    public ProfileDataController(IProfileDataService profileDataService, AppDbContext context)
    {
        _profileDataService = profileDataService;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfileData()
    {
        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (error != null || user == null)
            return BadRequest(new { message = error });

        var result = await _profileDataService.GetUserActivityAsync(user.Id);

        return Ok(result);
    }
}