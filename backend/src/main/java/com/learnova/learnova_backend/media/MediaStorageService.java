package com.learnova.learnova_backend.media;

import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    MediaUploadResult uploadImage(MultipartFile file, MediaFolder folder, String publicIdHint);

    void delete(String publicId);
}
