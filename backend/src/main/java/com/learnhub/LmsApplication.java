package com.learnhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;

@SpringBootApplication
public class LmsApplication {
    public static void main(String[] args) {
        loadEnv();
        SpringApplication.run(LmsApplication.class, args);
    }

    private static void loadEnv() {
        String[] possiblePaths = { ".env", "../.env", "backend/.env" };
        File envFile = null;
        for (String path : possiblePaths) {
            File f = new File(path);
            if (f.exists() && f.isFile()) {
                envFile = f;
                break;
            }
        }

        if (envFile != null) {
            System.out.println("Loading environment variables from: " + envFile.getAbsolutePath());
            try {
                List<String> lines = Files.readAllLines(Paths.get(envFile.toURI()));
                for (String line : lines) {
                    line = line.trim();
                    if (line.isEmpty() || line.startsWith("#")) {
                        continue;
                    }
                    int eqIdx = line.indexOf('=');
                    if (eqIdx > 0) {
                        String key = line.substring(0, eqIdx).trim();
                        String value = line.substring(eqIdx + 1).trim();
                        
                        if (value.startsWith("\"") && value.endsWith("\"")) {
                            value = value.substring(1, value.length() - 1);
                        } else if (value.startsWith("'") && value.endsWith("'")) {
                            value = value.substring(1, value.length() - 1);
                        }
                        
                        if (System.getProperty(key) == null) {
                            System.setProperty(key, value);
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to load .env file: " + e.getMessage());
            }
        } else {
            System.out.println("No .env file found at startup.");
        }
    }
}
