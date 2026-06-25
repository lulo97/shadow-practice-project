using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[Route("api/[controller]")]
[ApiController]
public class UserSettingsController : ControllerBase
{
    private readonly AppDbContext _context;

    public UserSettingsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("")]
    public async Task<ActionResult<UserSetting>> GetByUserId()
    {
        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        if (error.HasValue)
        {
            return Unauthorized(new { message = error.ToString() });
        }

        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(u => u.UserId == user.Id);

        if (settings == null)
        {
            return Ok(new UserSetting
            {
                UserId = user.Id,
                SttProviderKey = "WHISPER_CPP",
                Volume = 70,
                RecordScreenUiStyle = "ONE_SENTENCE",
                Loop = 0,
                VideoWidthSize = 50
            });
        }

        return Ok(settings);
    }

    [HttpPost]
    public async Task<ActionResult<UserSetting>> AddOrEdit(UserSetting settings)
    {
        if (!IsValid(settings, out var errors))
        {
            return BadRequest(new { message = errors.Count > 0 ? string.Join(", ", errors) : string.Empty });
        }

        var existingSettings = await _context.UserSettings
            .FirstOrDefaultAsync(u => u.UserId == settings.UserId);

        if (existingSettings == null)
        {
            _context.UserSettings.Add(settings);
        }
        else
        {
            existingSettings.SttProviderKey = settings.SttProviderKey;
            existingSettings.Volume = settings.Volume;
            existingSettings.RecordScreenUiStyle = settings.RecordScreenUiStyle;
            existingSettings.Loop = settings.Loop;
            existingSettings.VideoWidthSize = settings.VideoWidthSize;
        }

        await _context.SaveChangesAsync();
        return Ok(existingSettings ?? settings);
    }

    [HttpGet("datasource")]
    public ActionResult<SettingDatasource> GetSettingDatasource()
    {
        return Ok(new SettingDatasource());
    }

    public class SettingDatasource
    {
        public List<string> SttProviders { get; set; } = new() { "WHISPER_CPP", "PARAKEET" };
        public List<string> RecordScreenUiStyles { get; set; } = new() { "ONE_SENTENCE", "MULTIPLE_SENTENCES" };
        public List<int> LoopOptions { get; set; } = new() { 0, 1 };
    }

    public static bool IsValid(UserSetting settings, out List<string> errors)
    {
        errors = new List<string>();

        // Use the same values as the DTO for consistency
        var ds = new SettingDatasource();

        if (!ds.SttProviders.Contains(settings.SttProviderKey))
            errors.Add($"Invalid STT Provider.");

        if (settings.Volume < 0 || settings.Volume > 100)
            errors.Add("Volume must be between 0 and 100.");

        if (!ds.RecordScreenUiStyles.Contains(settings.RecordScreenUiStyle))
            errors.Add($"Invalid UI Style.");

        if (!ds.LoopOptions.Contains(settings.Loop))
            errors.Add("Loop must be 0 or 1.");

        if (settings.VideoWidthSize < 10 || settings.VideoWidthSize > 90)
            errors.Add("VideoWidthSize must be between 10 and 90.");

        return errors.Count == 0;
    }
}