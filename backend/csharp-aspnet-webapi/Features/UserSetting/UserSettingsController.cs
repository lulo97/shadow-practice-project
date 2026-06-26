using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return BadRequest(new { message = error });
        }

        var existingSettings = await _context.UserSettings
            .FirstOrDefaultAsync(u => u.UserId == user.Id);

        if (existingSettings == null)
        {
            _context.UserSettings.Add(settings);
        }
        else
        {
            existingSettings.SttProviderKey = settings.SttProviderKey;
            existingSettings.Volume = settings.Volume;
            existingSettings.Loop = settings.Loop;
            existingSettings.VideoWidthSize = settings.VideoWidthSize;
        }

        await _context.SaveChangesAsync();
        return Ok(existingSettings ?? settings);
    }

    public class UpdateSettingDto
    {
        public required string Key { get; set; }
        public required object Value { get; set; }
    }

    [HttpPost("update-property")]
    public async Task<ActionResult<UserSetting>> PatchSetting([FromBody] UpdateSettingDto request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Key))
        {
            return BadRequest(new { message = "Invalid request payload." });
        }

        var (user, error) = await HttpContext.GetUserFromCookieAsync(_context);

        if (user == null)
        {
            return BadRequest(new { message = error });
        }

        var existingSettings = await _context.UserSettings
            .FirstOrDefaultAsync(u => u.UserId == user.Id);

        if (existingSettings == null)
        {
            existingSettings = new UserSetting
            {
                UserId = user.Id,
                SttProviderKey = "WHISPER_CPP",
                Volume = 70,
                Loop = 0,
                VideoWidthSize = 50
            };
        }

        var propertyInfo = typeof(UserSetting).GetProperty(request.Key,
            System.Reflection.BindingFlags.Public |
            System.Reflection.BindingFlags.Instance |
            System.Reflection.BindingFlags.IgnoreCase);

        if (propertyInfo == null)
        {
            return BadRequest(new { message = $"Property '{request.Key}' does not exist on UserSetting." });
        }

        try
        {
            object? convertedValue = null;

            if (request.Value != null)
            {
                var targetType = Nullable.GetUnderlyingType(propertyInfo.PropertyType)
                                 ?? propertyInfo.PropertyType;

                // JsonElement (from System.Text.Json) doesn't implement IConvertible
                // so we must extract the raw value first
                var rawValue = request.Value is System.Text.Json.JsonElement jsonElement
                    ? jsonElement.ValueKind switch
                    {
                        System.Text.Json.JsonValueKind.String => (object?)jsonElement.GetString(),
                        System.Text.Json.JsonValueKind.Number => jsonElement.TryGetInt64(out var l) ? l : jsonElement.GetDouble(),
                        System.Text.Json.JsonValueKind.True => true,
                        System.Text.Json.JsonValueKind.False => false,
                        System.Text.Json.JsonValueKind.Null => null,
                        _ => throw new InvalidOperationException($"Unsupported JSON value kind: {jsonElement.ValueKind}")
                    }
                    : request.Value;

                if (rawValue != null)
                {
                    convertedValue = targetType.IsEnum
                        ? Enum.Parse(targetType, rawValue.ToString()!, ignoreCase: true)
                        : Convert.ChangeType(rawValue, targetType, System.Globalization.CultureInfo.InvariantCulture);
                }
            }
            else if (propertyInfo.PropertyType.IsValueType &&
                     Nullable.GetUnderlyingType(propertyInfo.PropertyType) == null)
            {
                return BadRequest(new { message = $"'{request.Key}' does not accept null." });
            }

            propertyInfo.SetValue(existingSettings, convertedValue);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to cast or assign value to '{request.Key}'. Details: {ex.Message}" });
        }

        if (!IsValid(existingSettings, out var errors))
        {
            return BadRequest(new { message = errors.Count > 0 ? string.Join(", ", errors) : "Validation failed." });
        }

        await _context.SaveChangesAsync();
        return Ok(existingSettings);
    }

    [HttpGet("datasource")]
    public ActionResult<SettingDatasource> GetSettingDatasource()
    {
        return Ok(new SettingDatasource());
    }

    public class SettingDatasource
    {
        public List<string> SttProviders { get; set; } = new() { "WHISPER_CPP", "PARAKEET" };
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

        if (!ds.LoopOptions.Contains(settings.Loop))
            errors.Add("Loop must be 0 or 1.");

        if (settings.VideoWidthSize < 10 || settings.VideoWidthSize > 90)
            errors.Add("VideoWidthSize must be between 10 and 90.");

        return errors.Count == 0;
    }
}