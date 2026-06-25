using System.Text;
using System.Text.Json;

// ─────────────────────────────────────────────────────────────────────────────
// Static class
// Usage: await LLM.RunAsync("Hello world");
// ─────────────────────────────────────────────────────────────────────────────
public class LlamaCpp : ILLM
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(360) };
    private const string BaseUrl = "http://127.0.0.1:8081";

    public async Task<string> RunAsync(string text)
    {
        var prompt =
            "Translate the following text to Vietnamese. " +
            "Reply with ONLY the translation, no explanation.\n\n" + text;

        var payload = JsonSerializer.Serialize(new
        {
            prompt,
            temperature = 0.7,
            top_p = 0.95,
            top_k = 64,
        });

        using var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await Http.PostAsync($"{BaseUrl}/v1/completion", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<CompletionResponse>();
        return result?.Content?.Trim()
               ?? throw new InvalidOperationException("Empty response from llama-server.");
    }

    internal static async Task WaitUntilReadyAsync(CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(180));

        while (!cts.IsCancellationRequested)
        {
            try
            {
                // Updated endpoint path below
                var resp = await Http.GetAsync($"{BaseUrl}/v1/health", cts.Token);
                if (resp.IsSuccessStatusCode)
                {
                    var body = await resp.Content.ReadFromJsonAsync<HealthResponse>(cancellationToken: cts.Token);
                    if (body?.Status == "ok") return;
                }
            }
            catch (HttpRequestException) { /* not up yet */ }

            await Task.Delay(500, cts.Token);
        }

        throw new TimeoutException("llama-server did not become ready within 180s.");
    }

    private sealed record HealthResponse(string Status);
    private sealed record CompletionResponse(string Content);
}