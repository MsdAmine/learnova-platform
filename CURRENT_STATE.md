# Current State

This file is the authoritative current state of the Learnova project.
Read this before starting any new implementation task.

## Project Name

Learnova

## Current Milestone

Frontend integration: wiring real backend APIs (catalog, enrollment, progress, quizzes, wishlist) into the dashboard and public pages.

## Backend Status

The backend is feature-complete for the current phase. These modules exist and are working:

- Authentication: registration, login, JWT token issuance, `/api/v1/auth/me`
- Users, roles, and account status: ROLE_LEARNER, ROLE_INSTRUCTOR, ROLE_ADMIN; role seeding; `AccountStatus`
- Profile switching: learner profile created on registration; `POST /api/v1/profile/switch`
- Instructor approval workflow: request, pending, approved, rejected states; admin approve/reject endpoints
- Categories: public listing and detail, ADMIN creation
- Instructor course CRUD: create, patch, publish, and archive courses (DRAFT→PUBLISHED, DRAFT/PUBLISHED→ARCHIVED); list own courses across all statuses via `GET /api/v1/instructor/courses` (not yet consumed by frontend)
- Public course catalog: `GET /api/v1/courses` and `GET /api/v1/courses/{courseId}` (published courses only)
- Learner enrollment: enroll in published courses (drafts blocked), list enrollments, look up enrollment by course
- Lesson progress: patch per-lesson progress, get per-course progress; `PATCH /api/v1/lessons/{lessonId}/progress` now atomically syncs `enrollment.progressPercentage` in the same transaction — dashboard enrollment data reflects lesson completion immediately; enrollment status transitions to `COMPLETED` with `completedAt` when all lessons are done. Access to both lesson-progress endpoints is enrollment-gated: only learners with an ACTIVE or COMPLETED enrollment may call them; non-enrolled or CANCELLED-enrollment requests receive 404 (content enumeration protection, consistent with the learner course content endpoint). `CourseAccessService.canUserAccessCourseContent()` is no longer a stub — it performs a real enrollment status check.
- Learner course content: `GET /api/v1/learner/courses/{courseId}/content` — returns section and lesson structure with per-lesson progress fields for enrolled learners (not yet consumed by frontend; course-player UI is now unblocked)
- Quiz authoring: instructor CRUD for quizzes, questions, and answer options, plus publish/archive
- Wishlist: list, add course, remove course
- Security hardening: JWT filter, account-status checks, and error dispatch (consistent 401/403 JSON responses)

Do not recreate or re-implement any of the above. The backend foundation is done.

## Frontend Status

A React + TypeScript + Vite frontend exists and is actively in development.

What is in place:

- Auth context, JWT handling, localStorage token storage
- React Router v7 with ProtectedRoute, GuestRoute, InstructorRoute, and AdminRoute guards
- Axios request interceptor (attaches JWT) and response interceptor (401 → logout + /login, 403 → /unauthorized), wired at runtime via ApiInterceptorSetup in RootLayout
- UnauthorizedPage at `/unauthorized`
- DashboardLayout with sidebar and topbar
- LearnerDashboard, MyCoursesPage, ProgressPage, CertificatesPage, LiveSessionsPage, SettingsPage
- Public course catalog page (`/courses`) with enrollment CTA
- API clients: `src/api/auth.ts`, `src/api/courses.ts` (public catalog), `src/api/enrollments.ts`
- Hooks: `useCurrentUser`, `useEnrollments`
- Learner dashboard and My Courses wired to real enrollment data
- UI component primitives: Button, Badge, Card, Avatar, Input, FilterTabs, ProgressBar, and more
- Design token system in tokens.css aligned with DESIGN.md

Still mocked or placeholder:

- CertificatesPage and LiveSessionsPage (no backend exists for these features)
- Weekly activity chart and some dashboard placeholder sections

## Known Gaps

- No frontend API clients yet for: lesson progress, learner course content, wishlist, quizzes, categories, admin instructor approval, profile switch
- No course-player page yet (backend `GET /api/v1/learner/courses/{courseId}/content` now exists; frontend not yet wired)
- No course-detail page yet (backend `GET /api/v1/courses/{courseId}` exists, unused)
- No certificates backend
- No live sessions backend
- Browser QA for `/courses` has not been performed
- InstructorRoute and AdminRoute exist but are not yet applied to instructor/admin routes (those routes do not yet exist)

## Current Priority

Build professional, consistent frontend interfaces using the Learnova design system, and integrate the remaining backend endpoints.

All new UI work must follow the reading order:

1. `PRODUCT.md` — product purpose, users, brand personality, and design principles
2. `DESIGN.md` — canonical design system with all tokens
3. `docs/design/page-specs/<page>.md` — the page-specific layout spec for the surface being built

## What Not to Do

- Do not recreate project foundation, authentication, or dual-profile logic.
- Do not recreate backend modules that already exist.
- Do not redefine design tokens. All tokens live in `DESIGN.md` and `tokens.css`.
- Do not introduce gamification patterns, XP systems, or leaderboard UI.
- Do not use the hero-metric template (big number, gradient accent) inside the product dashboard.
- Do not import raw Axios in feature code — always use the shared instance in `src/api/axios.ts`.
