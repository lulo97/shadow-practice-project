using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

public class LlamaCpp : ILLM
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(360) };
    private const string BaseUrl = "http://127.0.0.1:8081";
    private SseService _sse;

    public LlamaCpp(SseService sse)
    {
        _sse = sse;
    }

    public async Task<string> RunAsync(string text)
    {
        var total_lines = text.Split('\n').Count(line => System.Text.RegularExpressions.Regex.IsMatch(line.Trim(), @"^\d+:"));

        var prompt =
            "Translate the following numbered lines to Vietnamese.\n\n" +
            "RULES (follow exactly):\n" +
            "1. Output EXACTLY " + total_lines + " lines. The total number of output lines MUST equal " + total_lines + ".\n" +
            "2. Preserve each line's index exactly. Line N in → Line N out. Never merge, split, or reorder lines.\n" +
            "3. Translate fragments as fragments. If an English line is an incomplete sentence, translate it as-is — do not continue it onto the next line or pull text from adjacent lines.\n" +
            "4. Output format: `index: vietnamese text` — one per line, nothing else.\n" +
            "5. No explanations, no blank lines, no extra output.\n\n" +
            "EXAMPLE:\n" +
            "Example input:\n" +
            "1: carving through the slopes\n" +
            "2: of the Cascade Mountains\n" +
            "Example correct output:\n" +
            "1: lướt trên các sườn núi\n" +
            "2: của dãy núi Cascade\n" +
            "Wrong output (lines merged):\n" +
            "1: lướt trên các sườn núi của dãy núi Cascade\n\n" +
            "Real input:\n" +
        text;

        var payload = JsonSerializer.Serialize(new
        {
            messages = new[]
            {
                new { role = "user", content = prompt }
            },
            stream = true,
            return_progress = true,
            reasoning_format = "auto",
            chat_template_kwargs = new { enable_thinking = false },
            reasoning_control = true,
            backend_sampling = false,
            timings_per_token = true,
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/v1/chat/completions");
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");
        request.Headers.Add("Accept", "*/*");

        using var response = await Http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        // Read SSE stream and accumulate the content delta
        var sb = new StringBuilder();
        await using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        var offSetIndexForSSE = 2;

        var currentIdx = 0;
        var lastSentIdx = -1; // <-- track last sent

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            //Console.WriteLine("===============================");
            /*sb.ToString().Trim() will output "1: line\n2: line\n3:line..., how to get the lastest 2rd line index"*/
            //Console.WriteLine(sb.ToString().Trim());
            var lines = sb.ToString().Trim().Split('\n');
            if (lines.Length - offSetIndexForSSE > 0)
            {
                string index = lines.ElementAtOrDefault(lines.Length - offSetIndexForSSE)?.Split(':')[0].Trim();
                currentIdx = int.Parse(index) + offSetIndexForSSE - 1;

                if (currentIdx != lastSentIdx) // <-- only send on change because frontend can render heavy lag
                {
                    lastSentIdx = currentIdx;
                    await _sse.SendToFrontEnd($"{{\"message\":\"UPDATE_TRANSLATION\", \"data\":\"{currentIdx}/{total_lines}\"}}");
                }
            }

            if (string.IsNullOrWhiteSpace(line)) continue;
            if (!line.StartsWith("data: ")) continue;

            var json = line["data: ".Length..];
            if (json == "[DONE]") break;

            using var doc = JsonDocument.Parse(json);
            var delta = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("delta");

            if (delta.TryGetProperty("content", out var contentProp))
            {
                var chunk = contentProp.GetString();
                if (chunk is not null)
                    sb.Append(chunk);
            }
        }

        var result = sb.ToString().Trim();
        if (string.IsNullOrEmpty(result))
            throw new InvalidOperationException("Empty response from llama-server.");

        if (currentIdx != total_lines)
        {
            return await RunParallelAsync(text);
        }

        return result;
    }

    public async Task<string> RunParallelAsync(string text)
    {
        var numberedLines = text
            .Split('\n')
            .Select(l => l.Trim())
            .Where(l => System.Text.RegularExpressions.Regex.IsMatch(l, @"^\d+:"))
            .ToList();

        var total_lines = numberedLines.Count;
        var results = new List<string>();

        for (int i = 0; i < numberedLines.Count; i++)
        {
            var line = numberedLines[i];
            var colonPos = line.IndexOf(':');
            var lineIndex = int.Parse(line[..colonPos].Trim());

            var prompt =
                "Translate the following single line to Vietnamese.\n\n" +
                "RULES (follow exactly):\n" +
                "1. Output EXACTLY 1 line.\n" +
                "2. Preserve the line index exactly.\n" +
                "3. Translate fragments as fragments — do not expand or complete the sentence.\n" +
                "4. Output format: `index: vietnamese text` — one line, nothing else.\n" +
                "5. No explanations, no blank lines, no extra output.\n\n" +
                "EXAMPLE:\n" +
                "Input:  2: of the Cascade Mountains\n" +
                "Output: 2: của dãy núi Cascade\n\n" +
                "Real input:\n" +
                line;

            var payload = JsonSerializer.Serialize(new
            {
                messages = new[]
                {
                new { role = "user", content = prompt }
            },
                stream = false,
            });

            using var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}/v1/chat/completions");
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");
            request.Headers.Add("Accept", "*/*");

            using var response = await Http.SendAsync(request);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(body);
            var translated = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString()
                ?.Trim();

            if (string.IsNullOrEmpty(translated))
                throw new InvalidOperationException($"Empty response for line: {line}");

            results.Add(translated);

            await _sse.SendToFrontEnd(
                $"{{\"message\":\"UPDATE_TRANSLATION_LINE_BY_LINE\", \"data\":\"{lineIndex}/{total_lines}\"}}");
        }

        var result = string.Join('\n', results);
        if (string.IsNullOrEmpty(result))
            throw new InvalidOperationException("Empty response from llama-server.");

        return result;
    }

    internal static async Task WaitUntilReadyAsync(CancellationToken ct)
    {
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(180));

        while (!cts.IsCancellationRequested)
        {
            try
            {
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
}