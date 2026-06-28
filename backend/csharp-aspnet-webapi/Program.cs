using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

// ============================================================
// SWITCH: Database backend
// Uncomment exactly ONE of the three blocks below.
// ============================================================

// --- Option A: SQLite (file-based, auto-deleted on start) ---
const string DbFileName = "app_debug.db";
if (File.Exists(DbFileName))
{
    try { File.Delete(DbFileName); }
    catch (IOException ex) { Console.WriteLine($"Could not delete old DB file: {ex.Message}"); }
}

// --- Option B: PostgreSQL ---
// const string PgConnectionString = "Host=localhost;Port=5432;Database=shadow;Username=postgres;Password=123";

// --- Option C: InMemory ---
//Can't use sql with this (this is dead code exist for fun only)

// ============================================================

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============================================================
// SWITCH: Register DbContext match your choice above
// ============================================================

// Option A: SQLite
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={DbFileName}"));

// Option B: PostgreSQL
//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseNpgsql(PgConnectionString));

// Option C: InMemory
//Error: microsoft.data.sqlite.sqliteexception (0x80004005): sqlite error 5: 'unable to delete/modify user-function due to active statements'.
//Switch to file and delete after use
//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseInMemoryDatabase("MyDb"));

// ============================================================
// SWITCH: Repository implementation match your DB choice
// ============================================================

// Option A/C: SQLite or InMemory
builder.Services.AddScoped<IVideoRepository, SqliteVideoRepository>();

// Option B: PostgreSQL
//builder.Services.AddScoped<IVideoRepository, PostgresVideoRepository>();

// ============================================================

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

// ============================================================
// SWITCH: Storage backend
// ============================================================

//For blob test
builder.Services.AddSingleton<IVideoFileReader, VideoDatabaseReader>();
builder.Services.AddSingleton<IVideoFileWriter, VideoDatabaseStorage>();
builder.Services.AddSingleton<IRecordFileReader, RecordDatabaseReader>();
builder.Services.AddSingleton<IRecordFileWriter, RecordDatabaseStorage>();

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