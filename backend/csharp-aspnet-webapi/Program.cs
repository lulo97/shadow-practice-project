using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("MyDb"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost3001",
        policy =>
        {
            policy.WithOrigins("http://localhost:3001")
                    .AllowCredentials() //allow to send cookie from browser to server
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Register the background service
builder.Services.AddHostedService<JobProcessorService>();

//Testing
builder.Services.AddScoped<IYtDlp, FakeYtDlp>();
builder.Services.AddTransient<IAsrService, FakeAsrService>();
builder.Services.AddScoped<ISTT, WhisperCpp>();
builder.Services.AddHostedService<ExternalServerStarter>(); 
builder.Services.AddScoped<VideoJobUtils>();
builder.Services.AddScoped<ILLM, FakeLlm>();
builder.Services.AddSingleton<SseService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // This makes all enums serialize as strings globally
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var app = builder.Build();

// Explicitly seed the database
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Check if empty before adding to avoid duplicate key errors on restart
    if (!context.Users.Any())
    {
        context.Users.Add(new User { Id = 1, Username = "alice", PasswordHashed = "4i5x,p^K96a5" });

        context.Users.Add(new User { Id = -1, Username = "admin", PasswordHashed = "4i5x,p^K96a5" });

        context.SaveChanges();
    }
}

app.UseCors("AllowLocalhost3001");

app.MapGet("/", () => "Hello World!");

app.MapGet("/health", () => new
{
    message = "ok"
});

app.UseSwagger();

app.UseSwaggerUI();

app.MapControllers();

app.Run();
