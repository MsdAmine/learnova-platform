# API Overview

This document provides the initial API structure.

The API follows this base path:

```text
/api/v1
```

## Authentication

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

## User and Profiles

- `GET /users/me`
- `GET /profiles/me`
- `POST /profiles/instructor/apply`
- `PATCH /profiles/active`

## Public Courses

- `GET /courses`
- `GET /courses/{courseId}`
- `GET /courses/search`
- `GET /categories`

## Instructor Courses

- `POST /instructor/courses`
- `GET /instructor/courses`
- `GET /instructor/courses/{courseId}`
- `PATCH /instructor/courses/{courseId}`
- `DELETE /instructor/courses/{courseId}`

## Sections and Lessons

- `POST /instructor/courses/{courseId}/sections`
- `PATCH /instructor/sections/{sectionId}`
- `DELETE /instructor/sections/{sectionId}`
- `POST /instructor/sections/{sectionId}/lessons`
- `PATCH /instructor/lessons/{lessonId}`
- `DELETE /instructor/lessons/{lessonId}`
- `GET /courses/{courseId}/sections`
- `GET /lessons/{lessonId}`

## Learner Enrollment

- `POST /learner/courses/{courseId}/enroll`
- `GET /learner/enrollments`
- `GET /learner/courses/{courseId}`

## Progress

- `POST /learner/lessons/{lessonId}/progress`
- `GET /learner/courses/{courseId}/progress`

## Quizzes

- `POST /instructor/courses/{courseId}/quizzes`
- `POST /instructor/quizzes/{quizId}/questions`
- `GET /learner/courses/{courseId}/quizzes`
- `POST /learner/quizzes/{quizId}/attempts`
- `GET /learner/quiz-attempts`

## Certificates

- `POST /learner/courses/{courseId}/certificate`
- `GET /learner/certificates`
- `GET /certificates/verify/{code}`

## Live Sessions

- `POST /instructor/courses/{courseId}/live-sessions`
- `GET /instructor/live-sessions`
- `PATCH /instructor/live-sessions/{sessionId}`
- `GET /learner/live-sessions/upcoming`
- `POST /learner/live-sessions/{sessionId}/join`
- `POST /learner/live-sessions/{sessionId}/leave`

## Notifications

- `GET /notifications`
- `PATCH /notifications/{notificationId}/read`
- `PATCH /notifications/read-all`

## Discussion

- `POST /courses/{courseId}/questions`
- `GET /courses/{courseId}/questions`
- `POST /questions/{questionId}/replies`
- `PATCH /instructor/replies/{replyId}/accepted`

## Reviews

- `POST /courses/{courseId}/reviews`
- `GET /courses/{courseId}/reviews`
- `PATCH /admin/reviews/{reviewId}/hide`

## Admin

- `GET /admin/dashboard`
- `GET /admin/users`
- `PATCH /admin/instructors/{instructorId}/approve`
- `PATCH /admin/instructors/{instructorId}/reject`
- `POST /admin/categories`
- `PATCH /admin/courses/{courseId}/deactivate`

## API Documentation

Swagger / OpenAPI will be used to document the API.

Expected Swagger URL:

```text
/api/swagger-ui.html
```

or:

```text
/swagger-ui/index.html
```
