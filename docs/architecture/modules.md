# Backend Modules

The backend is organized by business capability.

## Auth Module

Responsible for:

- Registration
- Login
- JWT generation
- Password hashing
- Current user retrieval

Main endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

## User and Profile Module

Responsible for:

- User account information
- Learner profile
- Instructor profile
- Instructor request workflow
- Profile switching

Main endpoints:

```text
GET   /api/v1/users/me
GET   /api/v1/profiles/me
POST  /api/v1/profiles/instructor/apply
PATCH /api/v1/profiles/active
```

## Course Module

Responsible for:

- Course creation
- Course update
- Course publishing
- Course archive
- Course ownership

Main endpoints:

```text
POST   /api/v1/instructor/courses
GET    /api/v1/instructor/courses
PATCH  /api/v1/instructor/courses/{courseId}
DELETE /api/v1/instructor/courses/{courseId}

GET    /api/v1/courses
GET    /api/v1/courses/{courseId}
```

## Course Structure Module

Responsible for:

- Sections
- Lessons
- Lesson ordering
- Lesson content

Main endpoints:

```text
POST /api/v1/instructor/courses/{courseId}/sections
POST /api/v1/instructor/sections/{sectionId}/lessons
GET  /api/v1/courses/{courseId}/sections
GET  /api/v1/lessons/{lessonId}
```

## Enrollment Module

Responsible for:

- Course enrollment
- Enrollment status
- Learner-course relationship

Main endpoints:

```text
POST /api/v1/learner/courses/{courseId}/enroll
GET  /api/v1/learner/enrollments
```

## Progress Module

Responsible for:

- Lesson completion
- Course progress percentage
- Last watched lesson
- Time spent learning

Main endpoints:

```text
POST /api/v1/learner/lessons/{lessonId}/progress
GET  /api/v1/learner/courses/{courseId}/progress
```

## Quiz Module

Responsible for:

- Quiz creation
- Questions
- Answer options
- Quiz attempts
- Automatic grading

Main endpoints:

```text
POST /api/v1/instructor/courses/{courseId}/quizzes
POST /api/v1/instructor/quizzes/{quizId}/questions

GET  /api/v1/learner/courses/{courseId}/quizzes
POST /api/v1/learner/quizzes/{quizId}/attempts
```

## Certificate Module

Responsible for:

- Completion validation
- Certificate generation
- Certificate verification

Main endpoints:

```text
POST /api/v1/learner/courses/{courseId}/certificate
GET  /api/v1/learner/certificates
GET  /api/v1/certificates/verify/{code}
```

## Live Session Module

Responsible for:

- Live session scheduling
- Meeting link management
- Access control
- Attendance tracking

Main endpoints:

```text
POST /api/v1/instructor/courses/{courseId}/live-sessions
GET  /api/v1/instructor/live-sessions

GET  /api/v1/learner/live-sessions/upcoming
POST /api/v1/learner/live-sessions/{sessionId}/join
POST /api/v1/learner/live-sessions/{sessionId}/leave
```

## Notification Module

Responsible for:

- In-app notifications
- Read/unread status
- User notification history

Main endpoints:

```text
GET   /api/v1/notifications
PATCH /api/v1/notifications/{id}/read
PATCH /api/v1/notifications/read-all
```

## Discussion Module

Responsible for:

- Course questions
- Lesson questions
- Replies
- Accepted answers

Main endpoints:

```text
POST /api/v1/courses/{courseId}/questions
GET  /api/v1/courses/{courseId}/questions
POST /api/v1/questions/{questionId}/replies
```

## Review Module

Responsible for:

- Course ratings
- Written reviews
- Review visibility

Main endpoints:

```text
POST /api/v1/courses/{courseId}/reviews
GET  /api/v1/courses/{courseId}/reviews
PATCH /api/v1/admin/reviews/{reviewId}/hide
```

## Admin Module

Responsible for:

- User management
- Instructor approval
- Course moderation
- Category management
- Platform statistics

Main endpoints:

```text
GET   /api/v1/admin/dashboard
GET   /api/v1/admin/users
PATCH /api/v1/admin/instructors/{id}/approve
PATCH /api/v1/admin/instructors/{id}/reject
POST  /api/v1/admin/categories
PATCH /api/v1/admin/courses/{courseId}/deactivate
```
