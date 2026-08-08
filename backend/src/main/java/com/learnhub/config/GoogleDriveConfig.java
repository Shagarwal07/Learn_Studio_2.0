package com.learnhub.config;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

@Configuration
public class GoogleDriveConfig {

    @Value("${google.drive.credentials.path:../resources/google-credentials.json}")
    private String credentialsPath;

    @Value("${GOOGLE_DRIVE_CREDENTIALS_JSON:}")
    private String rawCredentialsJson;

    @Bean
    public Drive googleDrive() throws Exception {
        InputStream credentialsStream;

        if (rawCredentialsJson != null && !rawCredentialsJson.trim().isEmpty()) {
            System.out.println("Loading Google Drive credentials from GOOGLE_DRIVE_CREDENTIALS_JSON environment variable.");
            credentialsStream = new ByteArrayInputStream(rawCredentialsJson.getBytes(StandardCharsets.UTF_8));
        } else {
            InputStream classPathStream = getClass().getClassLoader().getResourceAsStream("google-credentials.json");
            if (classPathStream != null) {
                System.out.println("Loading Google Drive credentials from classpath (src/main/resources/google-credentials.json).");
                credentialsStream = classPathStream;
            } else {
                java.io.File file = new java.io.File(credentialsPath);
                if (!file.exists()) {
                    System.out.println("Credentials file not found at path: " + credentialsPath + ". Trying fallback search paths...");
                    java.util.List<String> fallbacks = java.util.List.of(
                        "resources/google-credentials.json",
                        "../resources/google-credentials.json",
                        "./resources/google-credentials.json",
                        "google-credentials.json"
                    );
                    for (String path : fallbacks) {
                        java.io.File f = new java.io.File(path);
                        if (f.exists()) {
                            file = f;
                            System.out.println("Found Google Drive credentials at: " + f.getAbsolutePath());
                            break;
                        }
                    }
                }

                if (!file.exists()) {
                    System.err.println("======================================================================");
                    System.err.println("⚠️ WARNING: Google Drive credentials file NOT FOUND.");
                    System.err.println("Google Drive Synchronization features will be disabled.");
                    System.err.println("======================================================================");
                    return null;
                }

                System.out.println("Loading Google Drive credentials from file path: " + file.getAbsolutePath());
                credentialsStream = new FileInputStream(file);
            }
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                .createScoped(Collections.singleton(DriveScopes.DRIVE));

        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

        return new Drive.Builder(httpTransport, jsonFactory, new HttpCredentialsAdapter(credentials))
                .setApplicationName("LearnStudio-Drive-Sync")
                .build();
    }
}
