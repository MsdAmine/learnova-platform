package com.learnova.learnova_backend.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CloudinaryMediaStorageServiceTest {

    private static final MockMultipartFile FILE =
            new MockMultipartFile("file", "avatar.jpg", "image/jpeg", new byte[]{1, 2, 3});

    @Test
    void uploadFailsEarlyWithCleanErrorWhenCloudinaryConfigIsIncomplete() {
        Cloudinary unconfigured = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "",
                "api_key", "",
                "api_secret", "",
                "secure", true));
        CloudinaryMediaStorageService service = new CloudinaryMediaStorageService(unconfigured);

        assertThatThrownBy(() -> service.uploadImage(FILE, MediaFolder.PROFILE_IMAGES, "learner-1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void uploadFailsEarlyWhenOnlyApiKeyIsMissing() {
        Cloudinary partiallyConfigured = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", "dnd5pu5me",
                "api_key", "",
                "api_secret", "some-secret",
                "secure", true));
        CloudinaryMediaStorageService service = new CloudinaryMediaStorageService(partiallyConfigured);

        assertThatThrownBy(() -> service.uploadImage(FILE, MediaFolder.PROFILE_IMAGES, "learner-1"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(ex -> ((ResponseStatusException) ex).getStatusCode())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }
}
