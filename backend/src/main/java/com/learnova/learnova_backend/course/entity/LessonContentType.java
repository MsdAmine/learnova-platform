package com.learnova.learnova_backend.course.entity;

/**
 * The kind of content a lesson carries.
 *
 * <p>V1 supports a single content body per lesson:
 * <ul>
 *   <li>{@link #TEXT} — instructor-authored body text stored in {@code textContent}.</li>
 *   <li>{@link #VIDEO}, {@link #PDF}, {@link #LINK} — an external http(s) resource URL
 *       stored in {@code contentUrl}.</li>
 * </ul>
 *
 * <p>A lesson may also have no content type ({@code null}), meaning the instructor
 * created the lesson as a structural placeholder and has not added a body yet.
 * File uploads are intentionally out of scope for V1.
 */
public enum LessonContentType {
    TEXT,
    VIDEO,
    PDF,
    LINK
}
