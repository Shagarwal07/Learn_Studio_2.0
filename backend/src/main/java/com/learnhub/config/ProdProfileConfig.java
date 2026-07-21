package com.learnhub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

@Configuration
public class ProdProfileConfig {

    @Value("${CORS_ALLOWED_ORIGINS:}")
    private String corsOrigins;

    @Value("${SPRING_DATASOURCE_URL:}")
    private String datasourceUrl;

    // Cloudinary validations removed

    @Value("${JWT_SECRET:}")
    private String jwtSecret;

    @PostConstruct
    public void validateEnv() {
        // In production profile, ensure essential env vars are set
        String activeProfile = System.getProperty("spring.profiles.active", "dev");
        if (!"dev".equalsIgnoreCase(activeProfile)) {
            if (corsOrigins == null || corsOrigins.isBlank()) {
                throw new IllegalStateException("CORS_ALLOWED_ORIGINS must be defined in production");
            }
            if (datasourceUrl == null || datasourceUrl.isBlank()) {
                throw new IllegalStateException("SPRING_DATASOURCE_URL must be defined in production");
            }
            // Cloudinary validations removed
            if (jwtSecret == null || jwtSecret.isBlank()) {
                throw new IllegalStateException("JWT_SECRET must be defined in production");
            }
        }
    }
}
