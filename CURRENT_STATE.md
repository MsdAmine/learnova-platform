# Current State

This file is the authoritative current state of the Learnova project.
Read this before starting any new implementation task.

## Project Name

Learnova

## Current Milestone

Frontend integration: learner course player, instructor content builder, instructor quiz management, admin instructor-approvals page, public course detail page, and saved-courses dashboard page are all wired to real backend APIs. The wishlist save-for-later action is integrated on both the public course detail page and the saved-courses dashboard page. Remaining gap is the learner quiz-taking flow.

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
  - `GET /api/v1/instructor/courses/{courseId}/quizzes` — lists all quizzes for an instructor-owned course; consumed by `InstructorQuizzesPage` on load
  - `GET /api/v1/instructor/courses/quizzes/{quizId}` — returns quiz detail with questions and answer options; consumed by `InstructorQuizzesPage` on expand
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
- Public course detail page (`CourseDetailPage`) at `/courses/:courseId` — no route guard; uses `GET /api/v1/courses/{courseId}`; marketing chrome (`<Navbar forceSolid />` + `<Footer />`); handles guest (sign-in CTA), authenticated-not-enrolled (enroll CTA), enrolled (continue-learning CTA), 404 (not-found panel), and generic-error (retry panel) states; does not expose public lessons, section previews, price, rating, duration, lesson count, instructor bio, or certificate claims; public course content still requires enrollment and `/dashboard/courses/:courseId`; wishlist save-for-later action integrated in the side action panel — learner-only (eligibility gate: `isAuthenticated && user.roles.includes('ROLE_LEARNER')`); guests see a "Sign in to save this course" link; saved state is derived non-blocking from `GET /api/v1/wishlist?size=200`; 409 on add and 404 on remove are treated as stale-state reconciliation (no error surfaced); wishlist does not unlock course content and does not replace enrollment
- API clients: `src/api/auth.ts`, `src/api/courses.ts` (public catalog + detail), `src/api/enrollments.ts`, `src/api/wishlist.ts` (wishlist list/add/remove; exports `WishlistCourse`, `Page<T>`, `getMyWishlist(size?)`, `addToWishlist`, `removeFromWishlist`)
- Hooks: `useCurrentUser`, `useEnrollments`
- Learner dashboard and My Courses wired to real enrollment data
- UI component primitives: Button, Badge, Card, Avatar, Input, FilterTabs, ProgressBar, and more
- Design token system in tokens.css aligned with DESIGN.md
- `CoursePlayerPage` at `/dashboard/courses/:courseId` — wired to `GET /api/v1/learner/courses/{courseId}/content` and `PATCH /api/v1/lessons/{lessonId}/progress`; optimistic lesson completion with rollback on error; auto-selects first incomplete lesson on load; 404 guard shows an enrollment-specific error
- `SavedCoursesPage` at `/dashboard/saved-courses` — learner dashboard page under the existing `ProtectedRoute` + `DashboardLayout`; uses `GET /api/v1/wishlist?size=200` and `DELETE /api/v1/wishlist/course/{courseId}`; reads the Spring `Page` `.content` field; renders saved course cards with category badge, level, title (links to `/courses/:courseId`), description, instructor name, and a Remove button; states: loading skeleton (3-card grid), empty state (→ `/courses` link), generic fetch error with retry, per-card remove-loading spinner, remove-404 stale-state reconciliation (treated as success), and inline per-card remove error; does not fetch enrollments; does not show enroll CTA, progress, duration, lesson count, price, rating, or certificate claims
- Instructor area: `InstructorLayout`, `InstructorCoursesPage` (`/instructor/courses`), `InstructorCourseContentPage` (`/instructor/courses/:courseId/content`), `InstructorQuizzesPage` (`/instructor/courses/:courseId/quizzes`) — all wired to real backend; guarded by `InstructorRoute` (checks `isAuthenticated` + `availableProfiles` includes `INSTRUCTOR`); uses `InstructorLayout`; `InstructorCourseContentPage` exposes a "Manage quizzes" link that navigates to the quiz management page for the same course
  - `InstructorQuizzesPage` supports: list quizzes; create quiz (title, optional description, passing score %, optional section); edit quiz; expand quiz detail (lazy-loads questions + answer options via `GET /quizzes/{quizId}`); add/edit/delete questions (content, points, type: MULTIPLE\_CHOICE | TRUE\_FALSE); add/edit/delete answer options; mark/unmark options as correct; publish quiz with friendly inline validation messages (no questions, no options, no correct option); archive quiz (renders the quiz and its questions/options as read-only); loading skeleton; not-found and generic-error states with retry
- Admin area: `AdminLayout`, `AdminInstructorApprovalsPage` (`/admin/instructor-approvals`) — wired to real backend; guarded by `AdminRoute`
- API clients implemented: `src/api/courseContent.ts` (learner content + lesson progress), `src/api/instructorCourseContent.ts` (section/lesson CRUD), `src/api/adminInstructorProfiles.ts` (pending list, approve, reject), `src/api/instructorCourses.ts` (course CRUD/publish/archive), `src/api/categories.ts` (category listing used in instructor course form), `src/api/instructorQuizzes.ts` (quiz/question/option CRUD, publish, archive, list, detail; exports `QuizResponse`, `QuizDetailResponse`, `QuestionResponse`, `AnswerOptionResponse`, `QuizStatus`, `QuestionType`, and all request payload types)
- `SettingsPage` instructor application panel: bio (required, max 1000 chars), expertise (required, max 500 chars), experience (optional), motivation (optional); on success re-fetches `/api/v1/auth/me` and refreshes `AuthContext`; surfaces null/pending/approved/rejected states; rejected state lazily fetches `/api/v1/instructor-profile/me` for `rejectionReason` and displays it inline; hidden for admin-only users (users with `ROLE_ADMIN` but without `INSTRUCTOR` in `availableProfiles`)
- `SettingsPage` admin area entry point: renders `AdminAccessPanel` (links to `/admin/instructor-approvals`) for any user with `ROLE_ADMIN`
- `DashboardLayout` sidebar: `Saved` nav item (`/dashboard/saved-courses`) is learner-only (`roleRequired: 'ROLE_LEARNER'`) and is hidden from admin-only users; instructor CTA hidden for admin-only users; shows "pending review" note when `instructorApprovalStatus === 'PENDING'`

Still mocked or placeholder:

- `CertificatesPage` and `LiveSessionsPage` — frontend placeholder pages; no backend exists for either feature
- Weekly activity chart and some dashboard sections are placeholder/mock
- `ProgressPage` shows enrollment-level progress only; no per-lesson breakdown display
- Course player lesson content area is a placeholder panel; no rich content, video, or lesson body rendering

## Known Gaps

- No public syllabus/section previews, instructor bio endpoint, course duration/lesson count, media/video preview (blocked: no backend contract for any of these)
- No certificates backend or frontend certificate UI
- No live sessions backend or frontend live session UI
- No catalog-card wishlist controls; `CourseCatalogCard` intentionally does not show save/unsave yet (deferred decision)
- No per-course wishlist status endpoint on the backend; saved state is derived from `GET /api/v1/wishlist?size=200` (v1 size cap)
- No auto-remove from wishlist after enrollment; wishlist and enrollment are independent at both the backend and frontend layers
- No learner quiz-taking UI, attempts, scoring, or results (instructor quiz authoring and management is implemented at `/instructor/courses/:courseId/quizzes`; no learner quiz attempt flow, no submission tracking, no per-learner score recording)
- No question or answer option ordering support (new questions/options are always appended; no drag-reorder)
- No unpublish or restore-from-archived quiz flow (publish is DRAFT→PUBLISHED; archive is terminal; no reverse transition in UI)
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
