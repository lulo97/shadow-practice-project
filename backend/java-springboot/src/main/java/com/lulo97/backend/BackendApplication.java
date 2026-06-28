package com.lulo97.backend;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

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

}
