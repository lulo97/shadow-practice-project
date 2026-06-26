
using System.Collections.Concurrent;

public class SseService
    {
    private readonly ConcurrentDictionary<string, StreamWriter> _clients = new();

    public void Register(string clientId, StreamWriter writer)
    {
        _clients[clientId] = writer;
    }

    public void Unregister(string clientId)
    {
        _clients.TryRemove(clientId, out _);
    }

    public async Task SendToFrontEnd(string jsonData)
    {
        foreach (var (clientId, writer) in _clients)
        {
            try
            {
                await writer.WriteLineAsync($"data: {jsonData}");
                await writer.WriteLineAsync(); // blank line = end of SSE event
                await writer.FlushAsync();
                Console.WriteLine("SendToFrontEnd: " + jsonData);
            }
            catch
            {
                _clients.TryRemove(clientId, out _);
            }
        }
    }
}

