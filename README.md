# Online Training Platform

A full-stack online learning platform built as a 4th year PFA project. The platform allows users to learn through structured courses, quizzes, progress tracking, certificates, and live sessions with instructors.

The system introduces a dual-profile model where a single user account can operate as both a learner and an instructor. Users can switch between learner mode and instructor mode without creating separate accounts.

## Project Objectives

The main objective of this project is to design and develop a complete online training platform that supports digital learning, instructor-led course creation, live sessions, student progress tracking, and certification.

The platform aims to provide:

- A structured learning experience through courses, sections, and lessons
- A dual-profile system allowing users to act as learners and instructors
- Instructor tools for course management, quizzes, and live sessions
- Learner tools for enrollment, progress tracking, assessments, and certificates
- Admin tools for user management, instructor approval, and platform moderation
- A clean and maintainable architecture suitable for future scalability

## Main Features

### 1. Authentication and User Management

Users can create an account, log in securely, and access the platform based on their roles and profiles.

Planned capabilities:

- User registration
- User login
- JWT-based authentication
- Password hashing
- Role-based access control
- User account status management

### 2. Dual-Profile System

A single account can have multiple profiles.

A user can be:

- Learner only
- Learner and instructor
- Admin

The learner profile is used for learning activities such as enrollments, progress, quizzes, and certificates.

The instructor profile is used for teaching activities such as course creation, quiz management, live sessions, and student tracking.

### 3. Instructor Approval Workflow

Users can request to become instructors. An admin reviews and approves or rejects the instructor profile.

This ensures that only approved instructors can publish courses.

### 4. Course Management

Approved instructors can create and manage courses.

A course includes:

- Title
- Description
- Category
- Level
- Thumbnail image
- Status: draft, published, archived
- Instructor information

### 5. Course Structure

Courses are organized into sections and lessons.

A lesson may include:

- Video content
- PDF files
- Text content
- External links
- Attached resources

### 6. Enrollment

Learners can enroll in published courses.

Enrollment allows learners to:

- Access course lessons
- Track learning progress
- Take quizzes
- Join live sessions
- Receive notifications
- Generate certificates after completion

### 7. Progress Tracking

The platform tracks learner progress for each course.

Tracked data includes:

- Completed lessons
- Course completion percentage
- Last accessed lesson
- Time spent learning

### 8. Quiz and Assessment System

Instructors can create quizzes linked to courses or sections.

The quiz system supports:

- Multiple-choice questions
- True/false questions
- Automatic grading
- Score calculation
- Pass/fail status
- Attempt history

### 9. Certificates

Learners can receive certificates after completing course requirements.

Certificate generation may depend on:

- Completing all required lessons
- Passing required quizzes
- Reaching the minimum completion percentage

### 10. Live Sessions with Instructors

Instructors can schedule live sessions linked to their courses.

The first version will use external meeting links or Jitsi integration instead of building video calls from scratch.

Live session features include:

- Scheduling
- Meeting link generation or storage
- Enrollment-based access
- Session status management
- Attendance tracking

### 11. Notifications

The platform sends notifications for important events.

Examples:

- New lesson added
- Live session scheduled
- Quiz available
- Certificate generated
- Instructor replied to a question
- New student enrolled

### 12. Discussion and Q&A

Learners can ask questions under courses or lessons. Instructors can reply, moderate discussions, and mark helpful answers.

### 13. Reviews and Ratings

Learners can review and rate courses after enrollment or completion.

### 14. Dashboards

The platform provides dashboards for different profiles.

Learner dashboard:

- Enrolled courses
- Completed courses
- Progress percentage
- Upcoming live sessions
- Quiz results
- Certificates
- Notifications

Instructor dashboard:

- Created courses
- Number of enrolled students
- Course completion rate
- Upcoming live sessions
- Quiz results
- Recent student questions

Admin dashboard:

- Total users
- Pending instructor approvals
- Total courses
- Active learners
- Moderation actions

### 15. Search and Filtering

Learners can search and filter courses by:

- Keyword
- Category
- Level
- Instructor
- Rating
- Newest courses
- Most popular courses

### 16. Recommendation System

The platform may recommend courses based on:

- Learner interests
- Enrolled course categories
- Popular courses
- Related learning paths

### 17. Content Moderation

Admins can moderate platform content, including reviews, comments, courses, and user accounts.

## Architecture

The project follows a modular monolith architecture.

The backend is divided into business modules such as authentication, profiles, courses, enrollments, progress, quizzes, live sessions, notifications, certificates, reviews, discussions, and administration.

This approach keeps the application simple to deploy while maintaining clean separation between features.

## Tech Stack

### Backend

- Java 17
- Spring Boot
- Spring Security
- JWT authentication
- Spring Data JPA
- PostgreSQL
- Maven
- Swagger / OpenAPI

### Frontend

- React
- TypeScript
- React Router
- Axios
- Tailwind CSS or CSS Modules

### Database

- PostgreSQL

### External Integrations

- Jitsi Meet or external meeting links for live sessions
- Email provider, optional
- Local file storage first, cloud storage optional

## Planned Repository Structure

```text
online-training-platform/
│
├── backend/
│   └── Spring Boot application
│
├── frontend/
│   └── React application
│
├── docs/
│   ├── architecture/
│   ├── decisions/
│   └── diagrams/
│
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── README.md
├── CONTRIBUTING.md
└── CURRENT_STATE.md
```

## Development Roadmap

### Phase 1: Project Foundation

- Repository setup
- Documentation setup
- Backend project initialization
- Frontend project initialization
- Database configuration
- Basic CI setup

### Phase 2: Authentication and Profiles

- User registration
- Login with JWT
- Role management
- Learner profile creation
- Instructor profile request
- Admin instructor approval
- Profile switching

### Phase 3: Course Core

- Course CRUD
- Categories
- Sections
- Lessons
- Course publishing workflow
- File upload basics

### Phase 4: Learner Flow

- Course browsing
- Search and filtering
- Enrollment
- Lesson access
- Progress tracking
- Wishlist

### Phase 5: Evaluation

- Quiz creation
- Quiz attempts
- Automatic grading
- Course completion logic
- Certificate generation

### Phase 6: Interaction and Live Sessions

- Live session scheduling
- Jitsi or external meeting link integration
- Attendance tracking
- Notifications
- Discussion and Q&A
- Reviews and ratings

### Phase 7: Dashboards and Polish

- Learner dashboard
- Instructor dashboard
- Admin dashboard
- Moderation tools
- Swagger documentation
- Testing
- UI polish

## Current Status

The backend (Spring Boot modular monolith) and frontend (React + TypeScript)
are both actively in development, with most core learner and instructor
workflows wired end-to-end: authentication, the dual-profile system,
instructor course/content/quiz authoring, learner enrollment, lesson
progress, quiz-taking with scoring/retake/attempt history, wishlist,
profile self-editing, certificate issuance and viewing, and live sessions
(implemented as a Jitsi-backed v1 — instructor scheduling and cancellation
for owned courses, enrollment-gated learner visibility, access-controlled
join, and idempotent attendance recording). Notifications, Q&A, reviews,
recommendations, file upload, recordings, and reminders remain planned (see
the roadmap above) and are not yet implemented.

See `CURRENT_STATE.md` for the exact current milestone, module-by-module
backend/frontend status, and known gaps, and `docs/report/` (start at
`docs/report/README.md`) for the full PFA report package — workflows, API
reference, use cases, test evidence, and known limitations.

## License

This project is developed for academic purposes as part of a 4th year PFA.
