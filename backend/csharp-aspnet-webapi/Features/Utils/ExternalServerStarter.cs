using System.Diagnostics;
using System.Net.NetworkInformation;

public class ExternalServerStarter : BackgroundService
{
    private readonly List<ServerConfig> _servers = new()
    {
        new ServerConfig { Port = 8080, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Features\Utils\stt.bat" },
        //new ServerConfig { Port = 8081, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Features\Utils\llm.bat" },
        new ServerConfig { Port = 8082, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\services\stt\parakeet\run.bat" },

    };

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        foreach (var server in _servers)
        {
            if (IsPortAvailable(server.Port))
            {
                Process.Start(new ProcessStartInfo(server.BatPath)
                {
                    UseShellExecute = true
                });
            }
        }
        return Task.CompletedTask;
    }

    private static bool IsPortAvailable(int port) =>
        !IPGlobalProperties.GetIPGlobalProperties().GetActiveTcpListeners().Any(x => x.Port == port);
}

public class ServerConfig
{
    public int Port { get; set; }
    public string BatPath { get; set; }
}