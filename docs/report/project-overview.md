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
score, retakes quizzes and reviews full attempt history, saves courses to a
wishlist for later, edits their own profile, and can issue and view a
certificate of completion once a course reaches 100% progress.

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
| `certificate` | Certificate issuance (on completed enrollment), listing, and self-scoped retrieval |
| `livesession` | Live session scheduling (instructor, ownership-checked), enrollment-gated learner visibility, access-controlled join, idempotent attendance recording — powered by generated Jitsi room URLs |
| `media` | Cloudinary-backed file upload abstraction (`MediaStorageService`/`CloudinaryMediaStorageService`/`MediaValidator`) for learner profile images and course thumbnails |
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
- Learner quiz-taking with automatic scoring, retake, and full attempt
  history
- Learner wishlist (save-for-later) and saved-courses dashboard
- Profile self-editing for both learner and instructor profiles
- Learner certificate issuance and viewing, triggered manually from the
  course player once a course reaches 100% progress (see
  `core-workflows.md` §9); the learner dashboard also displays a learner's
  already-issued certificates, with each card linking to the certificate
  view route
- Approved-instructor profile switching between the learner and instructor
  areas from all three UI entry points (dashboard switch card, instructor
  layout back-to-learner action, and Settings page), backed by
  `POST /api/v1/profile/switch` (see `core-workflows.md` §11)
- Live sessions (v1): instructor scheduling for owned courses, instructor
  listing/cancellation, enrollment-gated learner visibility of upcoming
  sessions, and access-controlled join with idempotent attendance recording
  — powered by generated Jitsi meeting URLs opened in a new browser tab (see
  `core-workflows.md` §10)
- Cloudinary-backed media upload (v1): learner profile image upload from
  Settings, and instructor course thumbnail upload from course edit mode —
  both backend-authenticated multipart uploads validated for MIME type,
  size, and non-empty content, with the prior Cloudinary asset deleted on
  replacement (see `core-workflows.md` §12–13)

## Current Limitations

These areas are intentionally **not** presented as complete:

- **Live sessions (v1 scope only)** — implemented as scheduling +
  access-controlled join + attendance via generated Jitsi URLs opened in a
  new browser tab. There is no iframe embedding, no Jitsi JWT/JaaS, no
  `/leave` endpoint, no recurring sessions, no reminders, and no
  past-session history view. See `limitations.md` for the full list.
- **Certificate issuance is manual, not automatic**, and offers only a
  browser print/save-as-PDF option — no server-generated PDF, sharing, QR
  code, or revocation flow exists. See `limitations.md` for the full list.
- **Lesson content body** — the course player's lesson content area is a
  placeholder panel; there is no rich text, video, or media rendering.
- **Content ordering** — sections, lessons, questions, and answer options are
  always appended; there is no drag-reorder or explicit ordering field.
- **File upload** — Cloudinary-backed v1 exists for learner profile images
  and course thumbnails (edit mode only) only; instructor profile image
  upload is not implemented (`InstructorProfile` has no image URL field),
  lesson attachments and certificate media/PDF storage do not exist, and
  no direct/unsigned frontend-to-Cloudinary upload is used. Live, successful
  upload against real Cloudinary credentials is unverified in this
  environment (placeholder credentials only).
- **Frontend automated testing is minimal** — a Vitest + React Testing
  Library + jsdom harness now exists (27 tests covering `useProfileSwitch`,
  the dashboard's certificate section, the `learnerQuizzes` API client, the
  `CoursePlayer` quiz history UI extracted into `QuizCard`/`AttemptHistory`,
  and the `liveSessions` API client / `LiveSessionsPage` UI), but there is no
  broad frontend integration suite — the full `CoursePlayer` route-level flow is
  not component-tested — and lint/build/manual browser QA remain the
  primary verification method for most UI. See `testing-summary.md`.
- **Profile switch UI** — fully implemented; no remaining navigation-only
  caveat. All three entry points (the learner dashboard's instructor switch
  card, the instructor area's "back to learner" action, and `SettingsPage`'s
  "Go to teaching area" action) call `POST /api/v1/profile/switch` through
  the shared `useProfileSwitch` hook.

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
switch to, and `POST /api/v1/profile/switch` (called via
`src/hooks/useProfileSwitch.ts`) is the source of truth for performing the
switch itself — the frontend never flips `activeProfile` locally without a
successful backend round-trip from the wired entry points.
