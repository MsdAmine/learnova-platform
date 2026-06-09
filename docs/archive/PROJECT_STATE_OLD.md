# Project State

This file tracks the current state of the Online Training Platform project.

Use this file as the authoritative project state before starting any new implementation task.

## Project Name

Online Training Platform

## Project Type

4th year PFA project

## Main Objective

Build a full-stack online learning platform that allows users to learn through structured courses, quizzes, progress tracking, certificates, and live sessions with instructors.

The platform supports a dual-profile system where one user account can switch between learner mode and instructor mode.

## Current Milestone

Milestone 2: Authentication & Dual Profiles

## Current Status

Phase 1 project foundation is complete. The project is moving into backend and frontend initialization, authentication, and dual-profile implementation.


## Confirmed Architecture

Architecture style:

```text
Modular monolith
```

### Backend:

- Spring Boot
- Java 17
- PostgreSQL
- JWT authentication
- Spring Security
- Spring Data JPA
- Swagger / OpenAPI

### Frontend:

- React
- TypeScript
- Axios
- React Router
- Tailwind CSS or CSS Modules

### Live sessions:

- External meeting links or Jitsi integration

## Confirmed Core Features

- Authentication
- Role-based access control
- Dual-profile system
- Instructor approval workflow
- Course management
- Course sections and lessons
- Course enrollment
- Progress tracking
- Quiz and assessment system
- Certificates
- Live sessions
- Attendance tracking
- Notifications
- Discussion and Q&A
- Reviews and ratings
- Search and filtering
- Dashboards
- Admin moderation
- Swagger API documentation

## Key Domain Rule

A user account represents identity.

A learner profile represents learning activity.

An instructor profile represents teaching activity.

Learning-related data should be attached to the learner profile.

Teaching-related data should be attached to the instructor profile.

## Next Tasks

- [ ] Setup Spring Boot backend project
- [ ] Configure PostgreSQL connection
- [ ] Implement User and Role entities
- [ ] Implement registration endpoint
- [ ] Implement login with JWT
- [ ] Create learner profile automatically after registration
- [ ] Implement instructor profile request
- [ ] Implement admin approval for instructor profiles
- [ ] Implement profile switching logic
- [ ] Setup React frontend project

## First Implementation Priority

The first implementation priority is the authentication and dual-profile system.

Target flow:

- User registers
- Learner profile is created automatically
- User can request instructor profile
- Admin approves instructor profile
- User can switch between learner and instructor modes

## Notes

Do not start implementing advanced features before the foundation is complete.

The project should remain clean, modular, and easy to explain in the final PFA defense.
