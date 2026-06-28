using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var is_test = true;

var FRONTEND_PORT = 3001;

if (is_test)
{
    Console.WriteLine("App state = TEST");

    //Database
    const string DbFileName = "app_debug.db";
    if (File.Exists(DbFileName))
    {
        try { File.Delete(DbFileName); }
        catch (IOException ex) { Console.WriteLine($"Could not delete old DB file: {ex.Message}"); }
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={DbFileName}"));

    //Video
    builder.Services.AddScoped<IVideoRepository, SqliteVideoRepository>();

    //Services
    builder.Services.AddScoped<IYtDlp, YtDlpCli>();
    builder.Services.AddTransient<IAsrService, FakeAsrService>();
    builder.Services.AddScoped<ILLM, LlamaCpp>();
    builder.Services.AddScoped<IProfileDataService, ProfileDataServiceSqlite>();

    //Reader Writer
    builder.Services.AddSingleton<IVideoFileReader, VideoDatabaseReader>();
    builder.Services.AddSingleton<IVideoFileWriter, VideoDatabaseStorage>();
    builder.Services.AddSingleton<IRecordFileReader, RecordDatabaseReader>();
    builder.Services.AddSingleton<IRecordFileWriter, RecordDatabaseStorage>();
} else
{
    Console.WriteLine("App state = PRODUCTION");

    //Database
    const string PgConnectionString = "Host=localhost;Port=5432;Database=shadow;Username=postgres;Password=123";
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(PgConnectionString));

    //Video
    builder.Services.AddScoped<IVideoRepository, PostgresVideoRepository>();

    //Services
    builder.Services.AddScoped<IYtDlp, YtDlpCli>();
    builder.Services.AddTransient<IAsrService, FakeAsrService>();
    builder.Services.AddScoped<ILLM, LlamaCpp>();
    builder.Services.AddScoped<IProfileDataService, ProfileDataServicePostgres>();

    //Reader Writer
    builder.Services.AddSingleton<IVideoFileReader, VideoLocalFileReader>();
    builder.Services.AddSingleton<IVideoFileWriter, VideoLocalFileStorage>();
    builder.Services.AddSingleton<IRecordFileReader, RecordLocalFileReader>();
    builder.Services.AddSingleton<IRecordFileWriter, RecordLocalFileStorage>();
}

builder.Services.AddScoped<WhisperCpp>();
builder.Services.AddScoped<Parakeet>();
builder.Services.AddScoped<ISTTFactory, STTFactory>();
builder.Services.AddHostedService<ExternalServerStarter>(provider =>
    new ExternalServerStarter(is_test));
builder.Services.AddScoped<VideoJobUtils>();
builder.Services.AddSingleton<SseService>();
builder.Services.AddHostedService<JobProcessorService>();

// --- InMemory Database ---
//Can't use sql with this (this is dead code exist for fun only)

//InMemory
//Error: microsoft.data.sqlite.sqliteexception (0x80004005): sqlite error 5: 'unable to delete/modify user-function due to active statements'.
//Switch to file and delete after use
//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseInMemoryDatabase("MyDb"));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins($"http://localhost:{FRONTEND_PORT}")
                   .AllowCredentials() //allow to send cookie from browser to server
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// Register the background service

//Testing


// ============================================================
// SWITCH: Storage backend
// ============================================================

//For blob test


//For actual production
//builder.Services.AddSingleton<IVideoFileReader, VideoLocalFileReader>();
//builder.Services.AddSingleton<IVideoFileWriter, VideoLocalFileStorage>();
//builder.Services.AddSingleton<IRecordFileReader, RecordLocalFileReader>();
//builder.Services.AddSingleton<IRecordFileWriter, RecordLocalFileStorage>();

// ============================================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // This makes all enums serialize as strings globally
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var app = builder.Build();

// Explicitly seed the database
if (is_test)
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Creates the tables if they don't exist
        context.Database.EnsureCreated();

        //Seed here
        if (!context.Users.Any())
        {
            context.Users.Add(new User { Id = Utils.TEST_USER_ID, Username = "alice", PasswordHashed = "4i5x,p^K96a5" });
            context.Users.Add(new User { Id = Utils.ADMIN_ID, Username = "admin", PasswordHashed = "4i5x,p^K96a5" });
            context.SaveChanges();
        }

        await SeedSystemVideos.RunAsync(scope, true);
        await SeedSystemVideos.RunAsync(scope, false);
    }
}

app.UseCors("AllowFrontend");

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