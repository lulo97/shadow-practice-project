using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json.Serialization;

// 1. Define the DB file name
const string DbFileName = "app_debug.db";

// 2. Delete the old file if it exists so you always start fresh
if (File.Exists(DbFileName))
{
    try
    {
        File.Delete(DbFileName);
    }
    catch (IOException ex)
    {
        Console.WriteLine($"Could not delete old DB file: {ex.Message}");
    }
}

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

//Can't use sql with this
//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseInMemoryDatabase("MyDb"));

//Error: microsoft.data.sqlite.sqliteexception (0x80004005): sqlite error 5: 'unable to delete/modify user-function due to active statements'.
//Switch to file and delete after use
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={DbFileName}"));

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
builder.Services.AddScoped<WhisperCpp>();
builder.Services.AddScoped<Parakeet>();
builder.Services.AddScoped<ISTTFactory, STTFactory>();
builder.Services.AddHostedService<ExternalServerStarter>(); 
builder.Services.AddScoped<VideoJobUtils>();
builder.Services.AddScoped<ILLM, LlamaCpp>();
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

    // Creates the tables if they don't exist
    context.Database.EnsureCreated();

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
app.UseStaticFiles();
app.UseSwagger();

app.UseSwaggerUI();

app.MapControllers();

app.Run();
