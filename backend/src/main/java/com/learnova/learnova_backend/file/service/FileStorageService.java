package com.learnova.learnova_backend.file.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    /**
     * Stores a file in the specified sub-folder.
     *
     * @param file      The file to store.
     * @param subFolder The sub-folder within the root upload directory.
     * @return The relative path/URL of the stored file.
     */
    String storeFile(MultipartFile file, String subFolder);

    /**
     * Deletes a file from the storage.
     *
     * @param filePath The relative path of the file to delete.
     */
    void deleteFile(String filePath);
}
