package com.learnova.learnova_backend.media;

public enum MediaFolder {

    PROFILE_IMAGES("learnova/profile-images"),
    COURSE_THUMBNAILS("learnova/course-thumbnails");

    private final String path;

    MediaFolder(String path) {
        this.path = path;
    }

    public String getPath() {
        return path;
    }
}
