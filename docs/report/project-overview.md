# Project Overview

This document is the report-level summary of **Learnova**, prepared for the
PFA (4th-year project) report and demo. It describes the project objective,
target users, core modules, implemented workflows, current limitations, and a
short architecture summary.

All claims below are based on the current backend controllers
(`backend/src/main/java`), the current frontend router
(`frontend/src/router/index.tsx`), and the project's living state document
(`CURRENT_STATE.md`). No feature is described as complete unless it is wired
end-to-end (backend endpoint + frontend integration).

---

## Project Objective

Learnova is a structured online learning platform for professional skill
development. It connects learners with expert-led courses, lets instructors
author and publish course content and assessments, and gives administrators
control over who can act as an instructor on the platform.

The platform is built as a **modular monolith** Spring Boot backend with a
React + TypeScript frontend, and implements a **dual-profile system**: a
single user account can hold both a learner profile and an instructor
profile, with instructor access gated behind an admin approval step.

## Target Users

**Learner** — browses the public course catalog, enrolls in published
courses, studies lessons at their own pace, takes quizzes and receives a
score, saves courses to a wishlist for later, and edits their own profile.

**Instructor** — requests instructor access (subject to admin approval),
creates and manages their own courses (draft → published → archived),
builds course content (sections and lessons), authors quizzes (questions and
answer options), and edits their own instructor profile.

**Admin** — reviews pending instructor profile requests and approves or
rejects them. This is currently the only administrative capability
implemented; there is no broader user-management console.

## Core Modules

| Module | Responsibility |
|---|---|
| `auth` | Registration, login, JWT issuance, `/auth/me` |
| `user` | `User` entity, roles, account status, role seeding |
| `profile` | Learner/instructor profiles, profile switching, admin approval, self-editing |
| `course` | Course CRUD, catalog, sections/lessons, lesson progress, quiz authoring, wishlist |
| `enrollment` | Learner enrollment, enrollment listing/lookup, learner course content |
| `security` | JWT filter, `CustomUserDetails`, method-level authorization, error dispatch |

## Implemented Workflows

The following workflows are implemented end-to-end (backend endpoint and,
where applicable, a wired frontend screen). Each is documented in detail in
`docs/report/core-workflows.md`:

- Learner registration and login
- Instructor application and admin approval
- Instructor course creation, content authoring, and quiz authoring
- Learner enrollment in published courses
- Learner lesson study and progress tracking
- Learner quiz-taking with automatic scoring
- Learner wishlist (save-for-later) and saved-courses dashboard
- Profile self-editing for both learner and instructor profiles

## Current Limitations

These areas are intentionally **not** presented as complete:

- **Certificates** — owned by another developer; no certificate backend or
  frontend exists in this codebase. `CertificatesPage` is a frontend
  placeholder only.
- **Live sessions** — no backend exists. `LiveSessionsPage` is a frontend
  placeholder/mock.
- **Lesson content body** — the course player's lesson content area is a
  placeholder panel; there is no rich text, video, or media rendering.
- **Quiz attempt history** — learners can start and submit one attempt at a
  time; there is no list of past attempts or a retake flow.
- **Content ordering** — sections, lessons, questions, and answer options are
  always appended; there is no drag-reorder or explicit ordering field.
- **File upload** — `thumbnailUrl` and `profileImageUrl` accept plain URL
  strings only; no media upload pipeline exists.
- **Profile switch UI** — the backend endpoint (`POST /api/v1/profile/switch`)
  exists, but no frontend profile-switcher component is wired to it yet.

A full breakdown of known gaps is in `docs/report/limitations.md`.

## Architecture Summary

**Backend** — Spring Boot (Java 17, Maven), organized as a modular monolith.
Each feature module follows a consistent `controller / service / dto / entity
/ repository` layout under `com.learnova.learnova_backend`. Authentication is
stateless JWT, validated by `JwtAuthenticationFilter` on every request.
Authorization is enforced both via Spring Security method-level
`@PreAuthorize` checks and via explicit ownership/enrollment checks inside
services (e.g., a learner can only reach course content for courses they are
enrolled in; an instructor can only mutate their own courses).

**Domain model** — see `docs/report/class-diagram.md` for the full UML. In
summary: `User` is the identity; `LearnerProfile` and `InstructorProfile` are
1-to-1 capability profiles; `Course` belongs to an `InstructorProfile` and a
`Category`, and contains `Section`s and `Lesson`s; `Enrollment` links a
`LearnerProfile` to a `Course`; `LessonProgress` tracks per-lesson completion;
`WishlistItem` links a `LearnerProfile` to a saved `Course`; `Quiz` belongs to
a `Course` (optionally scoped to a `Section`) and contains `Question`s, which
in turn contain `AnswerOption`s.

**Frontend** — React + TypeScript on Vite, with React Router v7. Route
guards (`GuestRoute`, `ProtectedRoute`, `InstructorRoute`, `AdminRoute`)
centralize authorization in `src/components/common/`. All API calls go
through a single shared Axios instance (`src/api/axios.ts`) with request
(JWT attach) and response (401 → logout, 403 → `/unauthorized`) interceptors.
Auth and active-profile state live in `AuthContext`; the backend's
`/auth/me` response is the source of truth for which profiles a user may
switch to.
