using System.Diagnostics;
using System.Text;

public class WhisperService : IHostedService, IDisposable
{
    private Process? _whisperProcess;
    private readonly ILogger<WhisperService> _logger;
    private StreamWriter? _logWriter;
    private readonly string _logFilePath;

    public WhisperService(ILogger<WhisperService> logger, IConfiguration config)
    {
        _logger = logger;
        // Put log next to app or configure via appsettings
        _logFilePath = config["Whisper:LogFile"] ?? Path.Combine(Directory.GetCurrentDirectory(), "logs", "whisper.log");
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        // Ensure log directory exists
        Directory.CreateDirectory(Path.GetDirectoryName(_logFilePath)!);

        // Open dedicated log file (append mode)
        _logWriter = new StreamWriter(_logFilePath, append: true, Encoding.UTF8)
        {
            AutoFlush = true
        };

        WriteWhisperLog($"=== Whisper started at {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");

        var startInfo = new ProcessStartInfo
        {
            FileName = "whisper-server",
            Arguments = "--model D:/sentence-shadower/ggml-large-v3-turbo-q8_0.bin --port 8080 --host 0.0.0.0",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        _whisperProcess = new Process { StartInfo = startInfo };

        // ✅ Write to whisper.log only — never touches app logger
        _whisperProcess.OutputDataReceived += (s, e) => {
            if (e.Data != null) WriteWhisperLog($"[OUT] {e.Data}");
        };
        _whisperProcess.ErrorDataReceived += (s, e) => {
            if (e.Data != null) WriteWhisperLog($"[ERR] {e.Data}");
        };

        _whisperProcess.Start();
        _whisperProcess.BeginOutputReadLine();
        _whisperProcess.BeginErrorReadLine();

        // ✅ Only app-level events go to main app logger
        _logger.LogInformation("Whisper.cpp started (PID: {Pid}), logs → {LogFile}",
            _whisperProcess.Id, _logFilePath);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        if (_whisperProcess != null && !_whisperProcess.HasExited)
        {
            _whisperProcess.Kill();
            _whisperProcess.WaitForExit(3000);
        }

        WriteWhisperLog($"=== Whisper stopped at {DateTime.Now:yyyy-MM-dd HH:mm:ss} ===");
        _logger.LogInformation("Whisper.cpp stopped.");

        return Task.CompletedTask;
    }

    private void WriteWhisperLog(string message)
    {
        var line = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff} {message}";
        _logWriter?.WriteLine(line);
    }

    public void Dispose()
    {
        _whisperProcess?.Dispose();
        _logWriter?.Flush();
        _logWriter?.Dispose();
    }
}