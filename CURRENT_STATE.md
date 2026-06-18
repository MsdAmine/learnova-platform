# Current State

This file is the authoritative current state of the Learnova project.
Read this before starting any new implementation task.

## Project Name

Learnova

## Current Milestone

Frontend integration: learner course player (with Lessons and Quizzes tabs), instructor content builder, instructor quiz management, admin instructor-approvals page, public course detail page, and saved-courses dashboard page are all wired to real backend APIs. The wishlist save-for-later action is integrated on both the public course detail page and the saved-courses dashboard page. Learner quiz-taking is end-to-end complete: backend (attempt creation, answer submission, scoring, result retrieval, attempt-history listing) and frontend (quiz list, start/resume attempt, radio-based answer selection, submit, result panel with per-question correctness, retake, and collapsible attempt history).

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
- Learner quiz-taking: enrolled learners can list, preview, attempt, submit, retake, and retrieve quiz results and full attempt history
  - `GET /api/v1/learner/courses/{courseId}/quizzes` — lists PUBLISHED quizzes for an enrolled course; excludes DRAFT and ARCHIVED; no isCorrect in response
  - `GET /api/v1/learner/quizzes/{quizId}` — returns learner-safe quiz detail (questions + options without isCorrect); enrollment-gated
  - `POST /api/v1/learner/quizzes/{quizId}/attempts` — starts or resumes an IN_PROGRESS attempt; idempotent (returns existing attempt if one is in progress); retaking after a SUBMITTED attempt creates a new attempt without overwriting the prior one
  - `POST /api/v1/learner/quiz-attempts/{attemptId}/submit` — submits answers; validates all quiz questions answered, no duplicates, options belong to questions; computes score: `scorePercentage = floor((earnedPoints * 100) / totalPoints)`, `passed = scorePercentage >= quiz.passingScore`; 409 if already SUBMITTED
  - `GET /api/v1/learner/quiz-attempts/{attemptId}` — returns submitted attempt result with per-question breakdown; ownership-gated (own attempt only)
  - `GET /api/v1/learner/quizzes/{quizId}/attempts` — returns all of the caller's attempts for a quiz, most-recent-first (`ORDER BY startedAt DESC`); SUBMITTED attempts include per-question result details, IN_PROGRESS attempts never expose answer correctness; same enrollment/quiz-status gating as the other learner quiz endpoints (404 for non-enrolled/CANCELLED enrollment, 404 for DRAFT/ARCHIVED quiz)
  - `QuizAttemptResponse` now includes `startedAt`
  - Access control: enrollment must be ACTIVE or COMPLETED; CANCELLED → 404; DRAFT/ARCHIVED quiz → 404; non-enrolled → 404 (content enumeration protection)
  - New entities: `QuizAttempt`, `QuizAttemptAnswer`, `QuizAttemptStatus` (IN_PROGRESS, SUBMITTED); v1 supports one selected option per question
- Wishlist: list, add course, remove course
- Profile self-editing: authenticated users can view and update their own profile data
  - `GET /api/v1/learner-profile/me` — returns the caller's learner profile
  - `PATCH /api/v1/learner-profile/me` — updates `displayName`, `bio`, `profileImageUrl` for the caller's learner profile
  - `PATCH /api/v1/instructor-profile/me` — updates `bio`, `expertise`, `experience`, `motivation` for the caller's instructor profile
  - No profile id appears in any of these URLs; the profile is always resolved from the authenticated principal
- Live sessions: new `livesession` module — instructors schedule/list/cancel sessions for their own courses; learners see upcoming sessions for enrolled courses only and join via a backend-validated endpoint
  - `POST /api/v1/instructor/courses/{courseId}/live-sessions` — creates a session for an owned course (`403` for another instructor's course); generates a Jitsi room (`https://meet.jit.si/learnova-live-<secure-random>`) and returns it in the response
  - `GET /api/v1/instructor/live-sessions` — lists the caller's own sessions (all courses)
  - `POST /api/v1/instructor/live-sessions/{sessionId}/cancel` — cancels the caller's own session (`SCHEDULED → CANCELLED`)
  - `GET /api/v1/learner/live-sessions/upcoming` — lists upcoming sessions only for courses where the caller has an ACTIVE or COMPLETED enrollment; response (`LearnerLiveSessionResponse`) intentionally omits `meetingUrl`/`meetingRoomName`
  - `POST /api/v1/learner/live-sessions/{sessionId}/join` — validates enrollment and session status (cancelled → `409`; not enrolled → `404`), records `SessionAttendance` idempotently (duplicate joins do not double-record), and returns the Jitsi meeting URL only in this response
  - `EnrollmentRepository.findByLearnerProfileIdAndStatusIn(...)` added to support the learner upcoming-sessions query
  - v1 scope: Jitsi-only (`MeetingProvider.JITSI`), no iframe embedding (frontend opens the URL in a new browser tab), no Jitsi JWT/JaaS, no `/leave` endpoint, no recurring sessions, no reminders, no past-session history view
- Security hardening: JWT filter, account-status checks, and error dispatch (consistent 401/403 JSON responses)

Do not recreate or re-implement any of the above. The backend foundation is done.

## Frontend Status

A React + TypeScript + Vite frontend exists and is actively in development. It now has a minimal automated test harness (Vitest + React Testing Library + jsdom): 27 tests, run via `npm run test`. Coverage is selective — `useProfileSwitch` success/failure, the learner dashboard's certificate-section states, the `learnerQuizzes` API client's attempt-history contract, the `CoursePlayer` quiz history UI extracted into `QuizCard`/`AttemptHistory` (`frontend/src/features/dashboard/components/courseQuiz/QuizCard.tsx`), and the `liveSessions` API client / `LiveSessionsPage` UI. `frontend/src/test/setup.ts` now runs `afterEach(cleanup)` to prevent React Testing Library DOM leakage between tests. There is no broad frontend integration suite yet, and the full `CoursePlayer` route-level flow (tab switching, data fetching, lesson tab, certificate panel) remains untested at that level. Browser QA remains important for visual/accessibility checks.

What is in place:

- Auth context, JWT handling, localStorage token storage
- React Router v7 with ProtectedRoute, GuestRoute, InstructorRoute, and AdminRoute guards
- Axios request interceptor (attaches JWT) and response interceptor (401 → logout + /login, 403 → /unauthorized), wired at runtime via ApiInterceptorSetup in RootLayout
- UnauthorizedPage at `/unauthorized`
- DashboardLayout with sidebar and topbar
- LearnerDashboard, MyCoursesPage, ProgressPage, CertificatesPage, LiveSessionsPage (wired to the live-session backend), SettingsPage
- Public course catalog page (`/courses`) with enrollment CTA; catalog card titles link to `/courses/:courseId`; enrolled card "Continue" links directly to `/dashboard/courses/:courseId`
- Public course detail page (`CourseDetailPage`) at `/courses/:courseId` — no route guard; uses `GET /api/v1/courses/{courseId}`; marketing chrome (`<Navbar forceSolid />` + `<Footer />`); handles guest (sign-in CTA), authenticated-not-enrolled (enroll CTA), enrolled (continue-learning CTA), 404 (not-found panel), and generic-error (retry panel) states; does not expose public lessons, section previews, price, rating, duration, lesson count, instructor bio, or certificate claims; public course content still requires enrollment and `/dashboard/courses/:courseId`; wishlist save-for-later action integrated in the side action panel — learner-only (eligibility gate: `isAuthenticated && user.roles.includes('ROLE_LEARNER')`); guests see a "Sign in to save this course" link; saved state is derived non-blocking from `GET /api/v1/wishlist?size=200`; 409 on add and 404 on remove are treated as stale-state reconciliation (no error surfaced); wishlist does not unlock course content and does not replace enrollment
- API clients: `src/api/auth.ts`, `src/api/courses.ts` (public catalog + detail), `src/api/enrollments.ts`, `src/api/wishlist.ts` (wishlist list/add/remove; exports `WishlistCourse`, `Page<T>`, `getMyWishlist(size?)`, `addToWishlist`, `removeFromWishlist`)
- Hooks: `useCurrentUser`, `useEnrollments`
- Learner dashboard and My Courses wired to real enrollment data; the dashboard's Certificates section reads real certificates via `getMyCertificates()` (loading skeleton, accessible error state with retry, real empty state) and each card links to `/dashboard/certificates/:certificateId`; the dashboard's previous local-placeholder "Upcoming Live Sessions" section and its fake "Download" certificate action have been removed (no live-sessions backend exists, and no certificate download/PDF feature exists)
- UI component primitives: Button, Badge, Card, Avatar, Input, FilterTabs, ProgressBar, and more
- Design token system in tokens.css aligned with DESIGN.md
- `CoursePlayerPage` at `/dashboard/courses/:courseId` — wired to `GET /api/v1/learner/courses/{courseId}/content` and `PATCH /api/v1/lessons/{lessonId}/progress`; optimistic lesson completion with rollback on error; auto-selects first incomplete lesson on load; 404 guard shows an enrollment-specific error; has two tabs — **Lessons** (existing behaviour) and **Quizzes**; Quizzes tab lists published quizzes for the enrolled course (lazy-loaded on first activation), allows starting or resuming an IN_PROGRESS attempt, native radio answer selection (one option per question), submit attempt, and a result panel showing score percentage, passed/not-passed badge, and per-question correct/incorrect feedback after submission; correct answers are never exposed before submission; each quiz card shows its status (not started / in progress / passed / not passed) and latest score when available, a "Retake quiz" action after a submitted attempt, and a collapsible attempt history (attempt number/date, status, score, passed/not-passed, "Resume" for IN_PROGRESS, "View result" for SUBMITTED); per-quiz attempt-history fetches run via `Promise.allSettled` and degrade silently per card on failure; uses `src/api/learnerQuizzes.ts` (including `listQuizAttempts(quizId)`)
- `SavedCoursesPage` at `/dashboard/saved-courses` — learner dashboard page under the existing `ProtectedRoute` + `DashboardLayout`; uses `GET /api/v1/wishlist?size=200` and `DELETE /api/v1/wishlist/course/{courseId}`; reads the Spring `Page` `.content` field; renders saved course cards with category badge, level, title (links to `/courses/:courseId`), description, instructor name, and a Remove button; states: loading skeleton (3-card grid), empty state (→ `/courses` link), generic fetch error with retry, per-card remove-loading spinner, remove-404 stale-state reconciliation (treated as success), and inline per-card remove error; does not fetch enrollments; does not show enroll CTA, progress, duration, lesson count, price, rating, or certificate claims
- Instructor area: `InstructorLayout`, `InstructorCoursesPage` (`/instructor/courses`), `InstructorCourseContentPage` (`/instructor/courses/:courseId/content`), `InstructorQuizzesPage` (`/instructor/courses/:courseId/quizzes`) — all wired to real backend; guarded by `InstructorRoute` (checks `isAuthenticated` + `availableProfiles` includes `INSTRUCTOR`); uses `InstructorLayout`; `InstructorCourseContentPage` exposes a "Manage quizzes" link that navigates to the quiz management page for the same course
  - `InstructorQuizzesPage` supports: list quizzes; create quiz (title, optional description, passing score %, optional section); edit quiz; expand quiz detail (lazy-loads questions + answer options via `GET /quizzes/{quizId}`); add/edit/delete questions (content, points, type: MULTIPLE\_CHOICE | TRUE\_FALSE); add/edit/delete answer options; mark/unmark options as correct; publish quiz with friendly inline validation messages (no questions, no options, no correct option); archive quiz (renders the quiz and its questions/options as read-only); loading skeleton; not-found and generic-error states with retry
- Admin area: `AdminLayout`, `AdminInstructorApprovalsPage` (`/admin/instructor-approvals`) — wired to real backend; guarded by `AdminRoute`
- Live sessions: `LiveSessionsPage` (`/dashboard/live-sessions`) — learner view; lists upcoming sessions for enrolled courses via `GET /api/v1/learner/live-sessions/upcoming` and joins via `POST /api/v1/learner/live-sessions/{sessionId}/join`, opening the returned Jitsi URL in a new browser tab (no iframe embed). `InstructorLiveSessionsPage` (`/instructor/live-sessions`, under `InstructorLayout`) — instructor view; schedules sessions (modal form with course select, title, optional description, start/end time, optional max participants), lists own sessions across courses, and cancels a `SCHEDULED` session with inline confirm. `InstructorLayout`'s nav includes a "Live sessions" tab, but the instructor nav row is `hidden md:flex` (desktop/tablet only) — on mobile, `/instructor/live-sessions` is reachable only by direct URL. Uses `src/api/liveSessions.ts`. Old fake `meet.learnova.app` / `recordings.learnova.app` placeholder links have been removed.
- API clients implemented: `src/api/courseContent.ts` (learner content + lesson progress), `src/api/instructorCourseContent.ts` (section/lesson CRUD), `src/api/adminInstructorProfiles.ts` (pending list, approve, reject), `src/api/instructorCourses.ts` (course CRUD/publish/archive), `src/api/categories.ts` (category listing used in instructor course form), `src/api/instructorQuizzes.ts` (quiz/question/option CRUD, publish, archive, list, detail; exports `QuizResponse`, `QuizDetailResponse`, `QuestionResponse`, `AnswerOptionResponse`, `QuizStatus`, `QuestionType`, and all request payload types), `src/api/learnerQuizzes.ts` (learner quiz list, quiz detail, start/resume attempt, submit attempt, get attempt result; exports `LearnerQuizSummaryResponse`, `LearnerQuizDetailResponse`, `QuizAttemptResponse`, `QuizAttemptAnswerResultResponse`, `QuizAttemptSubmitRequest`, `QuizAttemptStatus`, `QuestionType`), `src/api/profile.ts` (get/update learner profile, update instructor profile)
- `SettingsPage` instructor application panel: bio (required, max 1000 chars), expertise (required, max 500 chars), experience (optional), motivation (optional); on success re-fetches `/api/v1/auth/me` and refreshes `AuthContext`; surfaces null/pending/approved/rejected states; rejected state lazily fetches `/api/v1/instructor-profile/me` for `rejectionReason` and displays it inline; hidden for admin-only users (users with `ROLE_ADMIN` but without `INSTRUCTOR` in `availableProfiles`)
- `SettingsPage` profile editing: learners can edit `displayName`, `bio`, and `profileImageUrl` via `GET`/`PATCH /api/v1/learner-profile/me`; instructors (when `INSTRUCTOR` is in `availableProfiles`) can edit `bio`, `expertise`, `experience`, and `motivation` via `PATCH /api/v1/instructor-profile/me`; uses `src/api/profile.ts`; the "Profile editing is not available yet" placeholder is removed
- `SettingsPage` admin area entry point: renders `AdminAccessPanel` (links to `/admin/instructor-approvals`) for any user with `ROLE_ADMIN`
- `DashboardLayout` sidebar: `Saved` nav item (`/dashboard/saved-courses`) is learner-only (`roleRequired: 'ROLE_LEARNER'`) and is hidden from admin-only users; instructor CTA hidden for admin-only users; shows "pending review" note when `instructorApprovalStatus === 'PENDING'`
- Profile switching is wired to the real backend: `switchActiveProfile(profileType)` in `src/api/profile.ts` calls `POST /api/v1/profile/switch`; `src/hooks/useProfileSwitch.ts` exposes `{ switching, error, switchTo }`, updates `AuthContext`'s active profile on success, and navigates (`LEARNER` → `/dashboard`, `INSTRUCTOR` → `/instructor/courses`); on failure it shows an inline `role="alert"` message and stays on the page. `DashboardLayout`'s instructor profile-switch card, `InstructorLayout`'s "Back to learner dashboard" action, and `SettingsPage`'s "Go to teaching area" action (in the approved-instructor application panel) all call this same hook — the switcher is no longer local-only `setActiveProfile()` state or a plain navigation link anywhere in the app. Route guards (`InstructorRoute`, etc.) are unaffected and still gate access independently.

Still mocked or placeholder:

- `ProgressPage` shows enrollment-level progress only (no per-lesson breakdown display); its fake weekly activity strip (`WEEK_ACTIVITY`) has been removed entirely — the page no longer renders any weekly-activity data, fake or real, since no learning-activity/analytics endpoint exists — the learner dashboard's own mocked sections (live sessions, certificates) have already been removed, per above
- Course player lesson content area is a placeholder panel; no rich content, video, or lesson body rendering

## Known Gaps

- No public syllabus/section previews, instructor bio endpoint, course duration/lesson count, media/video preview (blocked: no backend contract for any of these)
- No certificate PDF generation (print/save-as-PDF via window.print() is available on the certificate view page; no server-side PDF generation)
- Live sessions v1 limitations: no `/leave` endpoint; no recurring sessions; no reminders; no past-session history view; the Jitsi room is opened in a new browser tab (no iframe embedding, no Jitsi JWT/JaaS); the public `meet.jit.si` room has no Learnova-side auth after the URL is handed to the learner — an unguessable room name is the v1 security boundary; the instructor nav's "Live sessions" tab is hidden on mobile (`hidden md:flex`), so mobile instructors must navigate to `/instructor/live-sessions` directly
- No catalog-card wishlist controls; `CourseCatalogCard` intentionally does not show save/unsave yet (deferred decision)
- No per-course wishlist status endpoint on the backend; saved state is derived from `GET /api/v1/wishlist?size=200` (v1 size cap)
- No auto-remove from wishlist after enrollment; wishlist and enrollment are independent at both the backend and frontend layers
- No pagination on the learner quiz attempt-history endpoint (`GET /api/v1/learner/quizzes/{quizId}/attempts` returns the full list, unbounded)
- No timers or duration fields on quizzes
- No quiz analytics or learner results dashboard
- No certificate integration based on quiz passing
- No multi-select (partial-credit) question type; v1 supports one selected option per question only
- No question or answer option ordering support (new questions/options are always appended; no drag-reorder)
- No unpublish or restore-from-archived quiz flow (publish is DRAFT→PUBLISHED; archive is terminal; no reverse transition in UI)
- No admin user management beyond instructor approvals
- No media upload; `thumbnailUrl` accepts a plain URL string only

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
