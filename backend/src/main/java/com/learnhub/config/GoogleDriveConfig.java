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
            System.out.println("Loading Google Drive credentials from file path: " + credentialsPath);
            credentialsStream = new FileInputStream(credentialsPath);
        }

        GoogleCredentials credentials = GoogleCredentials.fromStream(credentialsStream)
                .createScoped(Collections.singleton(DriveScopes.DRIVE_READONLY));

        HttpTransport httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        GsonFactory jsonFactory = GsonFactory.getDefaultInstance();

        return new Drive.Builder(httpTransport, jsonFactory, new HttpCredentialsAdapter(credentials))
                .setApplicationName("LearnStudio-Drive-Sync")
                .build();
    }
}
