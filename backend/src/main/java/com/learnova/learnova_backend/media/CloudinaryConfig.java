package com.learnova.learnova_backend.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Builds the Cloudinary client from Spring-resolved config, with a narrow local-dev
 * fallback: if an env var is blank (e.g. {@code ./mvnw spring-boot:run} without exporting
 * it), only the three CLOUDINARY_* keys are read directly from a local .env file. This is
 * deliberately not a general dotenv loader — JWT_SECRET, DB_*, and every other key in .env
 * are never parsed or applied, so a placeholder JWT_SECRET there can't break startup.
 */
@Slf4j
@Configuration
public class CloudinaryConfig {

    private static final List<String> CLOUDINARY_ENV_KEYS = List.of(
            "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET");

    @Bean
    public Cloudinary cloudinary(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret
    ) {
        Map<String, String> dotenvFallback = readCloudinaryKeysFromDotenv(Path.of(".env"));

        String resolvedCloudName = firstNonBlank(cloudName, dotenvFallback.get("CLOUDINARY_CLOUD_NAME"));
        String resolvedApiKey = firstNonBlank(apiKey, dotenvFallback.get("CLOUDINARY_API_KEY"));
        String resolvedApiSecret = firstNonBlank(apiSecret, dotenvFallback.get("CLOUDINARY_API_SECRET"));

        if (resolvedCloudName.isBlank() || resolvedApiKey.isBlank() || resolvedApiSecret.isBlank()) {
            log.warn("Cloudinary configuration is incomplete (cloud_name present={}, api_key present={}, "
                            + "api_secret present={}). Media uploads will fail until CLOUDINARY_CLOUD_NAME, "
                            + "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.",
                    !resolvedCloudName.isBlank(), !resolvedApiKey.isBlank(), !resolvedApiSecret.isBlank());
        }

        return new Cloudinary(ObjectUtils.asMap(
                "cloud_name", resolvedCloudName,
                "api_key", resolvedApiKey,
                "api_secret", resolvedApiSecret,
                "secure", true
        ));
    }

    static String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) {
            return primary;
        }
        return fallback == null ? "" : fallback;
    }

    /**
     * Reads only CLOUDINARY_* keys from a .env file, ignoring every other line (JWT_SECRET,
     * DB_*, etc.). Returns an empty map if the file doesn't exist or can't be read.
     */
    static Map<String, String> readCloudinaryKeysFromDotenv(Path envPath) {
        Set<String> allowedKeys = Set.copyOf(CLOUDINARY_ENV_KEYS);
        Map<String, String> values = new HashMap<>();

        if (!Files.isReadable(envPath)) {
            return values;
        }

        try {
            for (String line : Files.readAllLines(envPath)) {
                String trimmed = line.trim();
                int eq = trimmed.indexOf('=');
                if (trimmed.isEmpty() || trimmed.startsWith("#") || eq < 0) {
                    continue;
                }
                String key = trimmed.substring(0, eq).trim();
                if (allowedKeys.contains(key)) {
                    values.put(key, trimmed.substring(eq + 1).trim());
                }
            }
        } catch (IOException e) {
            log.warn("Failed to read local .env for Cloudinary fallback config: {}", e.getMessage());
        }

        return values;
    }
}
