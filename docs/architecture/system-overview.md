# System Overview

## Introduction

The Online Training Platform is a full-stack web application that enables users to learn through online courses, assessments, live sessions, and certificates.

The system supports three main usage modes:

- Learner mode
- Instructor mode
- Admin mode

A key feature of the platform is the dual-profile model. A single user account can have both a learner profile and an instructor profile.

## Architecture Style

The application follows a modular monolith architecture.

This means the backend is deployed as one application, but internally organized into clear business modules.

This approach is suitable for the project because it provides:

- Simpler development
- Easier deployment
- Clear separation of responsibilities
- Good maintainability
- Possibility of future migration to microservices if needed

## High-Level Architecture

```text
+-------------------+
|     React App     |
|-------------------|
| Public Pages      |
| Learner UI        |
| Instructor UI     |
| Admin UI          |
+---------+---------+
          |
          | REST API with JWT
          |
+---------v---------+
|   Spring Boot API |
|-------------------|
| Security Layer    |
| Controllers       |
| Services          |
| Repositories      |
| Domain Modules    |
+---------+---------+
          |
          | JPA / Hibernate
          |
+---------v---------+
|    PostgreSQL     |
+-------------------+

External Integrations:
- Jitsi Meet or external meeting links
- Optional email provider
- File storage
```

## Backend Responsibilities

The backend is responsible for:

- Authentication and authorization
- User and profile management
- Course management
- Enrollment management
- Progress tracking
- Quiz and assessment logic
- Certificate generation
- Live session scheduling
- Notification management
- Reviews and discussions
- Admin moderation
- API documentation

## Frontend Responsibilities

The frontend is responsible for:

- Presenting public course pages
- Managing authentication state
- Allowing users to switch between profiles
- Displaying learner, instructor, and admin dashboards
- Calling backend APIs
- Handling forms and validation
- Providing a responsive user interface

## Database Responsibilities

PostgreSQL stores persistent data such as:

- Users
- Roles
- Learner profiles
- Instructor profiles
- Courses
- Sections
- Lessons
- Enrollments
- Progress records
- Quizzes
- Quiz attempts
- Certificates
- Live sessions
- Notifications
- Reviews
- Discussions

## Dual-Profile Model

The system separates account identity from platform activity.

```text
User Account
│
├── Learner Profile
│   ├── Enrollments
│   ├── Progress
│   ├── Quiz Attempts
│   ├── Certificates
│   └── Wishlist
│
└── Instructor Profile
    ├── Courses
    ├── Lessons
    ├── Quizzes
    ├── Live Sessions
    └── Student Analytics
```

This model allows the same person to learn and teach using one account.

## Security Overview

The system uses JWT-based authentication.

Authorization is based on:

- User roles
- Active profile
- Resource ownership

Examples:

- Only approved instructors can publish courses
- Only enrolled learners can access course lessons
- Only course owners can update their courses
- Only admins can approve instructor profiles

## Live Session Strategy

The platform will not implement custom video streaming in the first version.

Instead, it will support:

- External meeting links
- Jitsi Meet integration

The backend manages:

- Session scheduling
- Access control
- Attendance tracking
- Session status

The video provider manages:

- Audio
- Video
- Screen sharing
- Real-time communication

## Future Scalability

The modular monolith can later evolve toward microservices if needed.

Possible future service boundaries:

- Auth service
- Course service
- Enrollment service
- Notification service
- Live session service
- Certificate service
