var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.MapGet("/v1/health", () => new
{
    message = "Server is working!"
});

app.Run();
