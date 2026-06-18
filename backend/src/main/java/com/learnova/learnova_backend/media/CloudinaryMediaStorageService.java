package com.learnova.learnova_backend.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryMediaStorageService implements MediaStorageService {

    private final Cloudinary cloudinary;

    @Override
    public MediaUploadResult uploadImage(MultipartFile file, MediaFolder folder, String publicIdHint) {
        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", folder.getPath(),
                    "public_id", publicIdHint,
                    "overwrite", true,
                    "resource_type", "image"
            ));

            String secureUrl = (String) uploadResult.get("secure_url");
            String publicId = (String) uploadResult.get("public_id");
            return new MediaUploadResult(secureUrl, publicId);
        } catch (IOException | RuntimeException e) {
            // The Cloudinary SDK throws unchecked RuntimeExceptions (not just IOException)
            // for configuration problems such as a missing/invalid cloud_name.
            log.warn("Cloudinary upload failed for folder {}: {}", folder, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to upload media to storage provider");
        }
    }

    @Override
    public void delete(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException | RuntimeException e) {
            log.warn("Failed to delete Cloudinary asset {}: {}", publicId, e.getMessage());
        }
    }
}
