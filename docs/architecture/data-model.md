# Data Model

This document describes the main database entities of the platform.

## Core Identity Model

```text
users
- id
- full_name
- email
- password_hash
- account_status
- created_at
- updated_at

roles
- id
- name

user_roles
- user_id
- role_id
```

## Profile Model

```text
learner_profiles
- id
- user_id
- bio
- level
- created_at

instructor_profiles
- id
- user_id
- bio
- expertise
- experience
- approval_status
- created_at
```

A user has one learner profile by default.

A user may have one instructor profile after applying to become an instructor.

## Course Model

```text
categories
- id
- name
- description

courses
- id
- instructor_profile_id
- category_id
- title
- description
- level
- thumbnail_url
- status
- created_at
- updated_at

sections
- id
- course_id
- title
- position

lessons
- id
- section_id
- title
- content_type
- content_url
- text_content
- duration_seconds
- position
```

## Enrollment and Progress Model

```text
enrollments
- id
- learner_profile_id
- course_id
- status
- enrolled_at
- completed_at

lesson_progress
- id
- learner_profile_id
- lesson_id
- completed
- last_position_seconds
- time_spent_seconds
- completed_at
```

## Quiz Model

```text
quizzes
- id
- course_id
- section_id
- title
- passing_score
- status

questions
- id
- quiz_id
- question_text
- question_type
- points

answer_options
- id
- question_id
- answer_text
- is_correct

quiz_attempts
- id
- quiz_id
- learner_profile_id
- score
- passed
- started_at
- submitted_at
```

## Live Session Model

```text
live_sessions
- id
- course_id
- instructor_profile_id
- title
- description
- start_time
- end_time
- meeting_url
- provider
- max_participants
- status

session_attendance
- id
- live_session_id
- learner_profile_id
- joined_at
- left_at
- status
```

## Notification Model

```text
notifications
- id
- recipient_user_id
- title
- message
- type
- read
- created_at
```

## Certificate Model

```text
certificates
- id
- learner_profile_id
- course_id
- certificate_code
- pdf_url
- issued_at
```

## Review Model

```text
course_reviews
- id
- course_id
- learner_profile_id
- rating
- comment
- visible
- created_at
```

## Discussion Model

```text
discussion_threads
- id
- course_id
- lesson_id
- learner_profile_id
- title
- content
- status
- created_at

discussion_replies
- id
- thread_id
- user_id
- content
- accepted_answer
- created_at
```

## Main Relationships

- `User 1 ---- 1 LearnerProfile`
- `User 1 ---- 0..1 InstructorProfile`
- `InstructorProfile 1 ---- * Course`
- `Course 1 ---- * Section`
- `Section 1 ---- * Lesson`
- `LearnerProfile * ---- * Course` (through Enrollment)
- `LearnerProfile 1 ---- * LessonProgress`
- `LearnerProfile 1 ---- * QuizAttempt`
- `LearnerProfile 1 ---- * Certificate`
- `Course 1 ---- * LiveSession`
- `LiveSession 1 ---- * SessionAttendance`
- `Course 1 ---- * CourseReview`
- `Course 1 ---- * DiscussionThread`

## Important Design Rule

Learning data belongs to the learner profile.

Teaching data belongs to the instructor profile.

Authentication data belongs to the user account.
