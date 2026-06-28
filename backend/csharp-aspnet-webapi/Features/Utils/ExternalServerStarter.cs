using System.Diagnostics;
using System.Net.NetworkInformation;

public class ExternalServerStarter : BackgroundService
{
    private bool _isTest;
    private readonly List<ServerConfig> _servers;
    public ExternalServerStarter(bool isTest)
    {
        _isTest = isTest;
        _servers = new List<ServerConfig>
        {
            new ServerConfig { Name = "WHISPER_CPP", IsOn = true, Port = 8080, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Features\Utils\stt.bat" },
            new ServerConfig { Name = "LLM", IsOn = !_isTest, Port = 8081, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\backend\csharp-aspnet-webapi\Features\Utils\llm.bat" },
            new ServerConfig { Name = "PARAKEET", IsOn = true, Port = 8082, BatPath = @"C:\Users\ADMIN\Desktop\shadow-practice-project\services\stt\parakeet\run.bat" },
        };
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        foreach (var server in _servers)
        {
            if (!server.IsOn)
            {
                Console.WriteLine("Skip server = " + server.Name);
                continue;
            }
            ;

            Console.WriteLine("Run server = " + server.Name);

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
    public string Name { get; set; }
    public int Port { get; set; }
    public string BatPath { get; set; }
    public bool IsOn { get; set; }
}