package com.lulo97.backend;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.ContextClosedEvent;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) throws IOException {
		String sqliteDatabaseFile = "app.db";

		if (Files.exists(Path.of(sqliteDatabaseFile))) {
			System.out.println("Sqlite database file exist, delete it.");
			Files.delete(Path.of(sqliteDatabaseFile));
		} else {
			System.out.println("Init new sqlite db file");
			Files.createFile(Path.of(sqliteDatabaseFile));
		}

		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	public CommandLineRunner startExternalServers() {
		return args -> {
			ExternalServerStarter starter = new ExternalServerStarter(false);
			starter.execute();
		};
	}

	@Bean
	public ApplicationListener<ContextClosedEvent> cleanupDb() {
		return event -> {
			try {
				Files.deleteIfExists(Path.of("app.db"));
				System.out.println("Database file deleted on shutdown.");
			} catch (IOException e) {
				System.err.println("Failed to delete database file: " + e.getMessage());
			}
		};
	}
}
