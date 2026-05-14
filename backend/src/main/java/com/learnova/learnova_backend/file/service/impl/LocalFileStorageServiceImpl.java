package com.learnova.learnova_backend.file.service.impl;

import com.learnova.learnova_backend.file.exception.FileStorageException;
import com.learnova.learnova_backend.file.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class LocalFileStorageServiceImpl implements FileStorageService {

    private final Path fileStorageLocation;

    public LocalFileStorageServiceImpl(@Value("${app.upload.dir}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (IOException ex) {
            throw new FileStorageException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String subFolder) {
        // Sanitize filename
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        
        try {
            // Check if the filename contains invalid characters
            if (originalFileName.contains("..")) {
                throw new FileStorageException("Filename contains invalid path sequence " + originalFileName);
            }

            // Create subfolder if it doesn't exist
            Path targetLocation = this.fileStorageLocation.resolve(subFolder);
            Files.createDirectories(targetLocation);

            // Generate unique filename
            String extension = "";
            int i = originalFileName.lastIndexOf('.');
            if (i > 0) {
                extension = originalFileName.substring(i);
            }
            String fileName = UUID.randomUUID().toString() + extension;

            // Copy file to target location
            Path filePath = targetLocation.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Return relative path (subfolder + filename)
            return Paths.get(subFolder, fileName).toString().replace("\\", "/");
        } catch (IOException ex) {
            throw new FileStorageException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path targetLocation = this.fileStorageLocation.resolve(filePath).normalize();
            
            // Security check: ensure the file is within the storage location
            if (!targetLocation.startsWith(this.fileStorageLocation)) {
                throw new FileStorageException("Cannot delete file outside of storage location");
            }
            
            Files.deleteIfExists(targetLocation);
        } catch (IOException ex) {
            throw new FileStorageException("Could not delete file " + filePath, ex);
        }
    }
}
