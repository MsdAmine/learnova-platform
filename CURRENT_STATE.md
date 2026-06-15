# Current State

This file is the authoritative current state of the Learnova project.
Read this before starting any new implementation task.

## Project Name

Learnova

## Current Milestone

Frontend integration: learner course player, instructor content builder, admin instructor-approvals page, and public course detail page are all wired to real backend APIs. Remaining gaps are wishlist and quiz-taking flow.

## Backend Status

The backend is feature-complete for the current phase. These modules exist and are working:

- Authentication: registration, login, JWT token issuance, `/api/v1/auth/me`
- Users, roles, and account status: ROLE_LEARNER, ROLE_INSTRUCTOR, ROLE_ADMIN; role seeding; `AccountStatus`
- Profile switching: learner profile created on registration; `POST /api/v1/profile/switch`
- Instructor approval workflow: request, pending, approved, rejected states; admin approve/reject endpoints
- Categories: public listing and detail, ADMIN creation
- Instructor course CRUD: create, patch, publish, and archive courses (DRAFT→PUBLISHED, DRAFT/PUBLISHED→ARCHIVED); list own courses across all statuses via `GET /api/v1/instructor/courses`
- Public course catalog: `GET /api/v1/courses` and `GET /api/v1/courses/{courseId}` (published courses only)
- Learner enrollment: enroll in published courses (drafts blocked), list enrollments, look up enrollment by course
- Lesson progress: patch per-lesson progress, get per-course progress; `PATCH /api/v1/lessons/{lessonId}/progress` now atomically syncs `enrollment.progressPercentage` in the same transaction — dashboard enrollment data reflects lesson completion immediately; enrollment status transitions to `COMPLETED` with `completedAt` when all lessons are done. Access to both lesson-progress endpoints is enrollment-gated: only learners with an ACTIVE or COMPLETED enrollment may call them; non-enrolled or CANCELLED-enrollment requests receive 404 (content enumeration protection, consistent with the learner course content endpoint). `CourseAccessService.canUserAccessCourseContent()` is no longer a stub — it performs a real enrollment status check.
- Learner course content: `GET /api/v1/learner/courses/{courseId}/content` — returns section and lesson structure with per-lesson progress fields for enrolled learners; wired to `CoursePlayerPage` via `src/api/courseContent.ts`
- Instructor course content management: CRUD for sections and lessons within own courses
  - `GET  /api/v1/instructor/courses/{courseId}/content` — lists sections and lessons for own course
  - `POST /api/v1/instructor/courses/{courseId}/sections` — creates a section
  - `PATCH /api/v1/instructor/courses/sections/{sectionId}` — updates section title
  - `DELETE /api/v1/instructor/courses/sections/{sectionId}` — deletes section and its lessons
  - `POST /api/v1/instructor/courses/sections/{sectionId}/lessons` — creates a lesson
  - `PATCH /api/v1/instructor/courses/lessons/{lessonId}` — updates lesson title
  - `DELETE /api/v1/instructor/courses/lessons/{lessonId}` — deletes a lesson
  - Security: requires INSTRUCTOR role + approved profile + course ownership; mutations on ARCHIVED courses return 409
  - Wired to `InstructorCourseContentPage` via `src/api/instructorCourseContent.ts`; inline edit/delete with confirm and optimistic state are all implemented
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
- Public course catalog page (`/courses`) with enrollment CTA; catalog card titles link to `/courses/:courseId`; enrolled card "Continue" links directly to `/dashboard/courses/:courseId`
- Public course detail page (`CourseDetailPage`) at `/courses/:courseId` — no route guard; uses `GET /api/v1/courses/{courseId}`; marketing chrome (`<Navbar forceSolid />` + `<Footer />`); handles guest (sign-in CTA), authenticated-not-enrolled (enroll CTA), enrolled (continue-learning CTA), 404 (not-found panel), and generic-error (retry panel) states; does not expose public lessons, section previews, price, rating, duration, lesson count, instructor bio, or certificate claims; public course content still requires enrollment and `/dashboard/courses/:courseId`
- API clients: `src/api/auth.ts`, `src/api/courses.ts` (public catalog + detail), `src/api/enrollments.ts`
- Hooks: `useCurrentUser`, `useEnrollments`
- Learner dashboard and My Courses wired to real enrollment data
- UI component primitives: Button, Badge, Card, Avatar, Input, FilterTabs, ProgressBar, and more
- Design token system in tokens.css aligned with DESIGN.md
- `CoursePlayerPage` at `/dashboard/courses/:courseId` — wired to `GET /api/v1/learner/courses/{courseId}/content` and `PATCH /api/v1/lessons/{lessonId}/progress`; optimistic lesson completion with rollback on error; auto-selects first incomplete lesson on load; 404 guard shows an enrollment-specific error
- Instructor area: `InstructorLayout`, `InstructorCoursesPage` (`/instructor/courses`), `InstructorCourseContentPage` (`/instructor/courses/:courseId/content`) — all wired to real backend; guarded by `InstructorRoute`
- Admin area: `AdminLayout`, `AdminInstructorApprovalsPage` (`/admin/instructor-approvals`) — wired to real backend; guarded by `AdminRoute`
- API clients implemented: `src/api/courseContent.ts` (learner content + lesson progress), `src/api/instructorCourseContent.ts` (section/lesson CRUD), `src/api/adminInstructorProfiles.ts` (pending list, approve, reject), `src/api/instructorCourses.ts` (course CRUD/publish/archive), `src/api/categories.ts` (category listing used in instructor course form)
- `SettingsPage` instructor application panel: bio (required, max 1000 chars), expertise (required, max 500 chars), experience (optional), motivation (optional); on success re-fetches `/api/v1/auth/me` and refreshes `AuthContext`; surfaces null/pending/approved/rejected states; rejected state lazily fetches `/api/v1/instructor-profile/me` for `rejectionReason` and displays it inline; hidden for admin-only users (users with `ROLE_ADMIN` but without `INSTRUCTOR` in `availableProfiles`)
- `SettingsPage` admin area entry point: renders `AdminAccessPanel` (links to `/admin/instructor-approvals`) for any user with `ROLE_ADMIN`
- `DashboardLayout` sidebar instructor CTA: hidden for admin-only users; shows "pending review" note when `instructorApprovalStatus === 'PENDING'`

Still mocked or placeholder:

- `CertificatesPage` and `LiveSessionsPage` — frontend placeholder pages; no backend exists for either feature
- Weekly activity chart and some dashboard sections are placeholder/mock
- `ProgressPage` shows enrollment-level progress only; no per-lesson breakdown display
- Course player lesson content area is a placeholder panel; no rich content, video, or lesson body rendering

## Known Gaps

- No public syllabus/section previews, instructor bio endpoint, course duration/lesson count, media/video preview (blocked: no backend contract for any of these)
- No certificates backend or frontend certificate UI
- No live sessions backend or frontend live session UI
- No wishlist frontend (backend `GET/POST/DELETE /api/v1/wishlist/...` endpoints exist)
- No quiz-taking learner UI (backend quiz authoring API exists; no learner quiz attempt flow)
- No profile switch UI (backend `POST /api/v1/profile/switch` exists; no switcher component wired)
- No admin user management beyond instructor approvals
- No media upload; `thumbnailUrl` accepts a plain URL string only
- Profile editing not available in Settings; name and email are displayed read-only

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
