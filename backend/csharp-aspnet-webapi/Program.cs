var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<IVideoCRUD, VideoCRUDInMemory>();
builder.Services.AddScoped<IVideoUtils, VideoUtilsYtdlp>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapGet("/v1/health", () => new
{
    message = "ok"
});

app.UseSwagger();
app.UseSwaggerUI();

app.MapControllers();

app.Run();
