package com.learnova.learnova_backend.course.dto;

import com.learnova.learnova_backend.course.entity.LessonContentType;

import java.net.URI;

/**
 * Shared conditional-validation rules for lesson content, used by both the
 * create and update request DTOs so the rules stay in one place.
 */
final class LessonContentValidation {

    private LessonContentValidation() {}

    /** TEXT lessons must carry non-blank body text. Other types are unconstrained here. */
    static boolean isTextContentValid(LessonContentType contentType, String textContent) {
        if (contentType != LessonContentType.TEXT) {
            return true;
        }
        return textContent != null && !textContent.isBlank();
    }

    /** URL-based lessons (VIDEO/PDF/LINK) must carry a valid http(s) URL. */
    static boolean isContentUrlValid(LessonContentType contentType, String contentUrl) {
        if (contentType == null || contentType == LessonContentType.TEXT) {
            return true;
        }
        return isHttpUrl(contentUrl);
    }

    static boolean isHttpUrl(String value) {
        if (value == null || value.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(value.strip());
            String scheme = uri.getScheme();
            return uri.getHost() != null
                    && ("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme));
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}
