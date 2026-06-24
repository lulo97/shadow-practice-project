using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("MyDb"));

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
