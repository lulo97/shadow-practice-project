package com.lulo97.backend;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExternalServerStarter {

    private final boolean isTest;
    private final List<ServerConfig> servers;

    public ExternalServerStarter(boolean isTest) {
        this.isTest = isTest;
        this.servers = new ArrayList<>();
        servers.add(new ServerConfig("WHISPER_CPP", true, 8080,
                "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Features\\Utils\\stt.bat"));
        // servers.add(new ServerConfig("LLM", true, 8081,
        // "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\backend\\csharp-aspnet-webapi\\Features\\Utils\\llm.bat"));
        // servers.add(new ServerConfig("PARAKEET", true, 8082,
        // "C:\\Users\\ADMIN\\Desktop\\shadow-practice-project\\services\\stt\\parakeet\\run.bat"));
    }

    public void execute() {
        for (ServerConfig server : servers) {
            if (!server.isOn) {
                System.out.println("Skip server = " + server.name);
                continue;
            }

            System.out.println("Run server = " + server.name);

            if (isPortAvailable(server.port)) {
                try {
                    startBatFile(server.batPath);
                } catch (IOException e) {
                    System.err.println("Failed to start " + server.name + ": " + e.getMessage());
                }
            } else {
                System.out.println(
                        "Port " + server.port + " already in use, skipping " + server.name);
            }
        }
    }

    private void startBatFile(String batPath) throws IOException {
        // "cmd /c start" mimics UseShellExecute = true (opens its own window, detached)
        ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", "start", "", batPath);
        pb.directory(new java.io.File(batPath).getParentFile());
        pb.start();
    }

    private static boolean isPortAvailable(int port) {
        Set<Integer> activePorts = new HashSet<>();
        try {
            Process process =
                    new ProcessBuilder("netstat", "-ano").redirectErrorStream(true).start();

            Pattern pattern =
                    Pattern.compile(":(\\d+)\\s+\\S+:\\d+\\s+LISTENING", Pattern.CASE_INSENSITIVE);

            try (BufferedReader reader =
                    new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.contains("LISTENING")) { 
                        Matcher m = pattern.matcher(line);
                        if (m.find()) {
                            activePorts.add(Integer.parseInt(m.group(1)));
                        }
                    }
                }
            }
            process.waitFor();
        } catch (IOException | InterruptedException e) {
            System.err.println("Failed to check port " + port + ": " + e.getMessage());
        }
        return !activePorts.contains(port);
    }

    public static class ServerConfig {
        String name;
        boolean isOn;
        int port;
        String batPath;

        public ServerConfig(String name, boolean isOn, int port, String batPath) {
            this.name = name;
            this.isOn = isOn;
            this.port = port;
            this.batPath = batPath;
        }
    }

    public static void main(String[] args) {
        new ExternalServerStarter(false).execute();
    }
}
