package com.lulo97.backend.features.stt;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class Whisper implements ISTT {

    private final String port;
    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String baseUrl;

    public Whisper() {
        this("8080");
    }

    public Whisper(String port) {
        this.port = port;
        this.baseUrl = "http://localhost:" + port;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
    }

    // ── 1. Check server is reachable ──────────────────────────────────────
    public boolean isServerOn() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/health"))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<Void> response = http.send(request, HttpResponse.BodyHandlers.discarding());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (Exception e) {
            System.err.println(e);
            return false;
        }
    }

    // ── 2. Check a model is loaded ────────────────────────────────────────
    public boolean isModelLoaded() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/health"))
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return false;

            JsonNode json = mapper.readTree(response.body());

            // whisper.cpp returns { "status": "ok" } when model is loaded
            // and { "status": "no model loaded" } when it isn't
            if (json.has("status")) {
                return "ok".equals(json.get("status").asText());
            }

            return false;
        } catch (Exception e) {
            System.err.println(e);
            return false;
        }
    }

    // ── 3. Speech-to-Text ─────────────────────────────────────────────────
    @Override
    public String Run(byte[] blob) {
        if (!isServerOn())
            throw new IllegalStateException("Whisper.cpp server is not running.");

        if (!isModelLoaded())
            throw new IllegalStateException("No model loaded in whisper.cpp server.");

        try {
            // Convert incoming audio (WebM/Opus, MP4, etc.) → 16kHz mono WAV
            byte[] wavBytes = SttUtils.convertToWav(blob);

            String boundary = "----WhisperBoundary" + UUID.randomUUID();
            byte[] multipartBody = buildMultipartBody(boundary, wavBytes);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/inference"))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(multipartBody))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException(
                        "whisper.cpp request failed with status " + response.statusCode());
            }

            JsonNode json = mapper.readTree(response.body());

            if (json.has("text")) {
                return json.get("text").asText("").trim();
            }

            throw new IllegalStateException("Unexpected response from whisper.cpp.");
        } catch (IOException e) {
            System.err.println(e);
            throw new UncheckedIOException(e);
        } catch (InterruptedException e) {
            System.err.println(e);
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Request to whisper.cpp was interrupted.", e);
        }
    }

    private byte[] buildMultipartBody(String boundary, byte[] wavBytes) throws IOException {
        List<byte[]> parts = new ArrayList<>();
        String lineBreak = "\r\n";

        // file part
        StringBuilder filePartHeader = new StringBuilder();
        filePartHeader.append("--").append(boundary).append(lineBreak);
        filePartHeader.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.wav\"").append(lineBreak);
        filePartHeader.append("Content-Type: audio/wav").append(lineBreak);
        filePartHeader.append(lineBreak);

        parts.add(filePartHeader.toString().getBytes(StandardCharsets.UTF_8));
        parts.add(wavBytes);
        parts.add(lineBreak.getBytes(StandardCharsets.UTF_8));

        // response_format part
        StringBuilder formatPart = new StringBuilder();
        formatPart.append("--").append(boundary).append(lineBreak);
        formatPart.append("Content-Disposition: form-data; name=\"response_format\"").append(lineBreak);
        formatPart.append(lineBreak);
        formatPart.append("json").append(lineBreak);

        parts.add(formatPart.toString().getBytes(StandardCharsets.UTF_8));

        // closing boundary
        parts.add(("--" + boundary + "--" + lineBreak).getBytes(StandardCharsets.UTF_8));

        int totalLength = parts.stream().mapToInt(p -> p.length).sum();
        byte[] result = new byte[totalLength];
        int offset = 0;
        for (byte[] part : parts) {
            System.arraycopy(part, 0, result, offset, part.length);
            offset += part.length;
        }
        return result;
    }

    @Override
    public String GetKey() {
        return "WHISPER_CPP";
    }
}