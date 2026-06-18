package com.learnova.learnova_backend.media;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CloudinaryConfigTest {

    @Test
    void firstNonBlankPrefersPrimaryWhenPresent() {
        assertThat(CloudinaryConfig.firstNonBlank("primary", "fallback")).isEqualTo("primary");
    }

    @Test
    void firstNonBlankFallsBackWhenPrimaryIsBlankOrNull() {
        assertThat(CloudinaryConfig.firstNonBlank("", "fallback")).isEqualTo("fallback");
        assertThat(CloudinaryConfig.firstNonBlank(null, "fallback")).isEqualTo("fallback");
    }

    @Test
    void firstNonBlankReturnsEmptyWhenBothMissing() {
        assertThat(CloudinaryConfig.firstNonBlank("", null)).isEmpty();
    }

    @Test
    void readsOnlyCloudinaryKeysFromDotenvIgnoringJwtAndDbKeys(@TempDir Path tempDir) throws IOException {
        Path envFile = tempDir.resolve(".env");
        Files.writeString(envFile, """
                JWT_SECRET=change-this-secret-later
                JWT_EXPIRATION_MS=86400000
                DB_URL=jdbc:postgresql://localhost:5432/learnova_db
                DB_USERNAME=learnova_user
                DB_PASSWORD=1234

                # comment line should be skipped
                CLOUDINARY_CLOUD_NAME=test-cloud
                CLOUDINARY_API_KEY=test-key
                CLOUDINARY_API_SECRET=test-secret
                """);

        Map<String, String> values = CloudinaryConfig.readCloudinaryKeysFromDotenv(envFile);

        assertThat(values).containsOnly(
                Map.entry("CLOUDINARY_CLOUD_NAME", "test-cloud"),
                Map.entry("CLOUDINARY_API_KEY", "test-key"),
                Map.entry("CLOUDINARY_API_SECRET", "test-secret"));
        assertThat(values).doesNotContainKeys("JWT_SECRET", "JWT_EXPIRATION_MS", "DB_URL", "DB_USERNAME", "DB_PASSWORD");
    }

    @Test
    void returnsEmptyMapWhenDotenvFileDoesNotExist(@TempDir Path tempDir) {
        Path missingFile = tempDir.resolve("does-not-exist.env");

        Map<String, String> values = CloudinaryConfig.readCloudinaryKeysFromDotenv(missingFile);

        assertThat(values).isEmpty();
    }
}
