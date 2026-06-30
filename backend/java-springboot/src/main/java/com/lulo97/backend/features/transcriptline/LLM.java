package com.lulo97.backend.features.transcriptline;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lulo97.backend.features.sse.SseService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class LLM {

    private static final HttpClient HTTP =
            HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(360)).build();

    private static final String BASE_URL = "http://127.0.0.1:8081";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final Pattern NUMBERED_LINE = Pattern.compile("^\\d+:.*");

    private final SseService sse;

    public LLM(SseService sse) {
        this.sse = sse;
    }

    public String run(String text) {
        try {
            return runAsync(text);
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to run LlamaCpp", e);
        }
    }

    public String runAsync(String text) throws IOException, InterruptedException {
        long totalLines =
                text.lines().filter(line -> NUMBERED_LINE.matcher(line.trim()).matches()).count();

        String prompt = "Translate the following numbered lines to Vietnamese.\n\n"
                + "RULES (follow exactly):\n" + "1. Output EXACTLY " + totalLines
                + " lines. The total number of output lines MUST equal " + totalLines + ".\n"
                + "2. Preserve each line's index exactly. Line N in → Line N out. Never merge, split, or reorder lines.\n"
                + "3. Translate fragments as fragments. If an English line is an incomplete sentence, translate it as-is — do not continue it onto the next line or pull text from adjacent lines.\n"
                + "4. Output format: `index: vietnamese text` — one per line, nothing else.\n"
                + "5. No explanations, no blank lines, no extra output.\n\n" + "EXAMPLE:\n"
                + "Example input:\n" + "1: carving through the slopes\n"
                + "2: of the Cascade Mountains\n" + "Example correct output:\n"
                + "1: lướt trên các sườn núi\n" + "2: của dãy núi Cascade\n"
                + "Wrong output (lines merged):\n"
                + "1: lướt trên các sườn núi của dãy núi Cascade\n\n" + "Real input:\n" + text;

        ObjectNode message = MAPPER.createObjectNode();
        message.put("role", "user");
        message.put("content", prompt);

        ObjectNode payloadNode = MAPPER.createObjectNode();
        payloadNode.putArray("messages").add(message);
        payloadNode.put("stream", true);
        payloadNode.put("return_progress", true);
        payloadNode.put("reasoning_format", "auto");
        ObjectNode chatTemplateKwargs = MAPPER.createObjectNode();
        chatTemplateKwargs.put("enable_thinking", false);
        payloadNode.set("chat_template_kwargs", chatTemplateKwargs);
        payloadNode.put("reasoning_control", true);
        payloadNode.put("backend_sampling", false);
        payloadNode.put("timings_per_token", true);

        String payload = MAPPER.writeValueAsString(payloadNode);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(BASE_URL + "/v1/chat/completions")).timeout(Duration.ofSeconds(360))
                .header("Content-Type", "application/json").header("Accept", "*/*")
                .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8)).build();

        HttpResponse<java.io.InputStream> response =
                HTTP.send(request, HttpResponse.BodyHandlers.ofInputStream());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IOException("llama-server returned status " + response.statusCode());
        }

        StringBuilder sb = new StringBuilder();
        int offSetIndexForSSE = 2;
        int currentIdx = 0;
        int lastSentIdx = -1;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {

            String line;
            while ((line = reader.readLine()) != null) {
                String[] lines = sb.toString().trim().split("\n");
                if (lines.length - offSetIndexForSSE > 0) {
                    String candidate = lines[lines.length - offSetIndexForSSE];
                    String index = candidate.split(":")[0].trim();
                    try {
                        currentIdx = Integer.parseInt(index) + offSetIndexForSSE - 1;
                    } catch (NumberFormatException ignored) {
                        // skip malformed index, keep previous currentIdx
                    }

                    if (currentIdx != lastSentIdx) {
                        lastSentIdx = currentIdx;
                        sse.sendToFrontEnd("{\"message\":\"UPDATE_TRANSLATION\", \"data\":\""
                                + currentIdx + "/" + totalLines + "\"}");
                    }
                }

                if (line.isBlank())
                    continue;
                if (!line.startsWith("data: "))
                    continue;

                String json = line.substring("data: ".length());
                if (json.equals("[DONE]"))
                    break;

                JsonNode root = MAPPER.readTree(json);
                JsonNode delta = root.path("choices").get(0).path("delta");

                if (delta.has("content") && !delta.get("content").isNull()) {
                    String chunk = delta.get("content").asText();
                    sb.append(chunk);
                }
            }
        }

        String result = sb.toString().trim();
        if (result.isEmpty()) {
            throw new IllegalStateException("Empty response from llama-server.");
        }

        if (currentIdx != totalLines) {
            return runParallelAsync(text);
        }

        return result;
    }

    public String runParallelAsync(String text) throws IOException, InterruptedException {
        List<String> numberedLines = new ArrayList<>();
        for (String l : text.split("\n", -1)) {
            String trimmed = l.trim();
            if (NUMBERED_LINE.matcher(trimmed).matches()) {
                numberedLines.add(trimmed);
            }
        }

        int totalLines = numberedLines.size();
        List<String> results = new ArrayList<>();

        for (String line : numberedLines) {
            int colonPos = line.indexOf(':');
            int lineIndex = Integer.parseInt(line.substring(0, colonPos).trim());

            String prompt = "Translate the following single line to Vietnamese.\n\n"
                    + "RULES (follow exactly):\n" + "1. Output EXACTLY 1 line.\n"
                    + "2. Preserve the line index exactly.\n"
                    + "3. Translate fragments as fragments — do not expand or complete the sentence.\n"
                    + "4. Output format: `index: vietnamese text` — one line, nothing else.\n"
                    + "5. No explanations, no blank lines, no extra output.\n\n" + "EXAMPLE:\n"
                    + "Input:  2: of the Cascade Mountains\n" + "Output: 2: của dãy núi Cascade\n\n"
                    + "Real input:\n" + line;

            ObjectNode message = MAPPER.createObjectNode();
            message.put("role", "user");
            message.put("content", prompt);

            ObjectNode payloadNode = MAPPER.createObjectNode();
            payloadNode.putArray("messages").add(message);
            payloadNode.put("stream", false);

            String payload = MAPPER.writeValueAsString(payloadNode);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BASE_URL + "/v1/chat/completions"))
                    .header("Content-Type", "application/json").header("Accept", "*/*")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response =
                    HTTP.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IOException("llama-server returned status " + response.statusCode());
            }

            JsonNode root = MAPPER.readTree(response.body());
            JsonNode contentNode = root.path("choices").get(0).path("message").path("content");
            String translated = contentNode.isMissingNode() ? null : contentNode.asText().trim();

            if (translated == null || translated.isEmpty()) {
                throw new IllegalStateException("Empty response for line: " + line);
            }

            results.add(translated);

            sse.sendToFrontEnd("{\"message\":\"UPDATE_TRANSLATION_LINE_BY_LINE\", \"data\":\""
                    + lineIndex + "/" + totalLines + "\"}");
        }

        String result = String.join("\n", results);
        if (result.isEmpty()) {
            throw new IllegalStateException("Empty response from llama-server.");
        }

        return result;
    }

    static void waitUntilReady(long timeoutSeconds) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeoutSeconds * 1000;

        while (System.currentTimeMillis() < deadline) {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(BASE_URL + "/v1/health")).GET().build();

                HttpResponse<String> resp =
                        HTTP.send(request, HttpResponse.BodyHandlers.ofString());
                if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                    JsonNode body = MAPPER.readTree(resp.body());
                    if (body.has("status") && "ok".equals(body.get("status").asText())) {
                        return;
                    }
                }
            } catch (IOException ignored) {
                // not up yet
            }

            Thread.sleep(500);
        }

        throw new RuntimeException(
                "llama-server did not become ready within " + timeoutSeconds + "s.");
    }
}
