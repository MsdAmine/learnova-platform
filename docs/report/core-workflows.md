# Core Workflows

This document walks through the platform's main end-to-end workflows for the
PFA report and demo. Each workflow lists the actor, goal, main steps, the
backend endpoints involved, the frontend route(s), and the result. All
endpoints and routes are taken directly from the controllers under
`backend/src/main/java` and the router at `frontend/src/router/index.tsx`.

---

## 1. Learner Registration and Login

**Actor:** Guest (unauthenticated visitor)

**Goal:** Create an account and sign in to access the learner dashboard.

**Main steps:**
1. Visitor opens `/register`, submits full name, email, and password.
2. Backend creates the `User` and automatically creates a `LearnerProfile`.
3. Visitor is redirected to `/login` (or logs in directly) and submits
   credentials.
4. Backend validates credentials and issues a JWT.
5. Frontend stores the token and fetches `/auth/me` to populate `AuthContext`
   (`user`, `roles`, `availableProfiles`, `instructorApprovalStatus`).
6. `activeProfile` is initialised to `'LEARNER'`.

**Backend endpoints:**
- `POST /api/v1/auth/register` (public)
- `POST /api/v1/auth/login` (public)
- `GET /api/v1/auth/me` (authenticated)

**Frontend routes:** `/register`, `/login` (both under `GuestRoute`) → redirects to `/dashboard` (under `ProtectedRoute`)

**Result:** Authenticated session with a learner profile; learner dashboard accessible.

---

## 2. Instructor Application and Admin Approval

**Actor:** Authenticated user (applicant) and Admin (reviewer)

**Goal:** Gain instructor access, gated by admin review.

**Main steps:**
1. Authenticated user opens Settings and submits the instructor application
   panel (bio, expertise, optional experience/motivation).
2. Backend creates an `InstructorProfile` with `approvalStatus = PENDING`.
3. Admin opens the instructor-approvals page and sees the pending list.
4. Admin approves or rejects (with a reason on rejection).
5. On approval, `availableProfiles` for that user will include `'INSTRUCTOR'`
   on the next `/auth/me` refresh; the frontend re-fetches this after the
   settings-page action completes. **Admin approval is what grants instructor
   access** — there is no other path to the `INSTRUCTOR` role.
6. On rejection, the user sees a rejected status and the stored rejection
   reason; resubmission behavior depends on the current implementation of
   the request endpoint.

**Backend endpoints:**
- `POST /api/v1/instructor-profile/request` (authenticated)
- `GET /api/v1/instructor-profile/me` (authenticated)
- `GET /api/v1/admin/instructor-profiles/pending` (ADMIN)
- `POST /api/v1/admin/instructor-profiles/{id}/approve` (ADMIN)
- `POST /api/v1/admin/instructor-profiles/{id}/reject` (ADMIN)

**Frontend routes:** `/dashboard/settings` (applicant), `/admin/instructor-approvals` (admin, under `AdminRoute`)

**Result:** `InstructorProfile.approvalStatus` transitions `PENDING → APPROVED` or `PENDING → REJECTED`; only `APPROVED` unlocks instructor-only routes and the `INSTRUCTOR` role for `@PreAuthorize` checks.

**Evidence:** `assets/screenshots/06-admin-instructor-approvals.png` (demo/report screenshot, not an automated test)

---

## 3. Instructor Creates Course, Content, and Quiz

**Actor:** Approved Instructor

**Goal:** Publish a course with structured content and at least one quiz.

**Main steps:**
1. Instructor creates a course (title, description, level, category,
   optional thumbnail URL) in `DRAFT` status.
2. Instructor adds sections, then lessons within each section, from the
   course content builder. Each lesson can optionally carry content: `TEXT`
   (a body typed directly into a plain text field, no rich text editor) or
   `VIDEO`/`PDF`/`LINK` (an external http(s) URL to the resource), plus an
   optional duration hint in seconds. A lesson with no content type is a
   structural placeholder with no body yet.
3. Instructor creates a quiz (title, optional description, passing score,
   optional section scope), adds questions (content, points, type:
   `MULTIPLE_CHOICE` or `TRUE_FALSE`), and adds answer options per question,
   marking the correct one(s).
4. Instructor publishes the quiz (blocked with inline validation if there
   are no questions, a question has no options, or no option is marked
   correct).
5. Instructor publishes the course (`DRAFT → PUBLISHED`), making it visible
   in the public catalog.

**Backend endpoints:**
- `POST /api/v1/instructor/courses`, `PATCH /api/v1/instructor/courses/{id}`, `POST .../publish`, `POST .../archive`
- `GET /api/v1/instructor/courses/{courseId}/content`, `POST .../sections`, `PATCH /api/v1/instructor/courses/sections/{sectionId}`, `DELETE` same, `POST .../sections/{sectionId}/lessons`, `PATCH /api/v1/instructor/courses/lessons/{lessonId}`, `DELETE` same
- `GET/POST /api/v1/instructor/courses/{courseId}/quizzes`, `GET/PUT /api/v1/instructor/courses/quizzes/{quizId}`, `PATCH .../publish`, `PATCH .../archive`
- `POST /api/v1/instructor/courses/quizzes/{quizId}/questions`, `PUT/DELETE /api/v1/instructor/courses/questions/{questionId}`
- `POST /api/v1/instructor/courses/questions/{questionId}/options`, `PUT/DELETE /api/v1/instructor/courses/options/{optionId}`

All instructor mutation endpoints require the `INSTRUCTOR` role and course
ownership; mutations on `ARCHIVED` courses return `409`.

**Frontend routes:** `/instructor/courses`, `/instructor/courses/:courseId/content`, `/instructor/courses/:courseId/quizzes` (all under `InstructorRoute`)

**Result:** A `PUBLISHED` course with section/lesson structure and at least one `PUBLISHED` quiz, visible to learners in the catalog and course player.

**Evidence:** `assets/screenshots/05-instructor-content-builder.png` (demo/report screenshot, not an automated test)

---

## 4. Learner Enrolls in a Course

**Actor:** Authenticated Learner

**Goal:** Gain access to a published course's content.

**Main steps:**
1. Learner browses the public catalog or opens a course detail page.
2. Learner clicks "Enroll" (DRAFT courses are blocked from enrollment).
3. Backend creates an `Enrollment` row (`status = ACTIVE`), unique per
   (learner, course).
4. Frontend reflects the enrollment with a "Continue learning" CTA in place
   of the enroll action.

**Backend endpoints:**
- `POST /api/v1/courses/{courseId}/enroll` (authenticated learner)
- `GET /api/v1/learner/enrollments`, `GET /api/v1/learner/enrollments/{courseId}`

**Frontend routes:** `/courses` (public catalog), `/courses/:courseId` (public detail, no guard) → `/dashboard/courses/:courseId` (course player, under `ProtectedRoute`)

**Result:** An `ACTIVE` enrollment record; the learner can now reach `/dashboard/courses/:courseId` and its lessons/quizzes.

**Evidence:** `assets/screenshots/01-public-catalog.png` (demo/report screenshot, not an automated test)

---

## 5. Learner Studies Lessons and Completes Progress

**Actor:** Enrolled Learner

**Goal:** Work through course lessons and track completion.

**Main steps:**
1. Learner opens the course player; it loads section/lesson structure with
   per-lesson progress via the learner course content endpoint.
2. The player auto-selects the first incomplete lesson.
3. Learner marks a lesson complete; the UI updates optimistically with
   rollback on error.
4. Backend atomically updates `LessonProgress` and rolls the per-course
   `progressPercentage` up onto `Enrollment` in the same transaction.
5. When all lessons are complete, `Enrollment.status` transitions to
   `COMPLETED` with `completedAt` set.

**Backend endpoints:**
- `GET /api/v1/learner/courses/{courseId}/content` (enrollment-gated: ACTIVE or COMPLETED only; not-enrolled → 404)
- `PATCH /api/v1/lessons/{lessonId}/progress` (LEARNER; enrollment-gated)
- `GET /api/v1/lessons/course/{courseId}/progress` (LEARNER; enrollment-gated)

**Frontend routes:** `/dashboard/courses/:courseId` (Lessons tab)

**Result:** Per-lesson completion state persisted; enrollment-level progress percentage kept in sync. Each lesson may also carry content set by the instructor (`contentType` of `TEXT`, `VIDEO`, `PDF`, or `LINK`): `TEXT` renders inline in the player; `VIDEO`/`PDF`/`LINK` render as a labeled external link that opens the resource in a new tab. There is no embedded video player, no lesson file upload, no Cloudinary lesson attachments, and no arbitrary iframe embedding — URL-based content is always a plain outbound link.

**Evidence:** `assets/screenshots/03-course-player-lessons.png`; also `assets/screenshots/mobile-course-player.png` (mobile viewport) (demo/report screenshots, not automated tests)

---

## 6. Learner Takes a Quiz and Receives a Score

**Actor:** Enrolled Learner

**Goal:** Attempt a published quiz and see a scored result.

**Main steps:**
1. Learner opens the Quizzes tab in the course player; published quizzes for
   the course are lazy-loaded on first activation.
2. Once the quiz list loads, the frontend fetches each quiz's attempt
   history (`GET /api/v1/learner/quizzes/{quizId}/attempts`, most-recent-first)
   in parallel; a failed per-quiz fetch degrades silently — that card's
   history panel just stays empty rather than blocking the tab.
3. Each quiz card shows its current status (not started / in progress /
   passed / not passed) and latest score when available.
4. Learner starts an attempt (or resumes an existing `IN_PROGRESS` one —
   this call is idempotent).
5. Learner selects one answer option per question via radio controls.
   **Correct answers are never exposed before submission** — the learner-safe
   question/option DTOs carry no `isCorrect` field, and `IN_PROGRESS`
   attempts in the history list never expose answer correctness either.
6. Submit is enabled only once every question has a selection.
7. Backend validates the submission (all questions answered, no duplicate
   answers, options belong to their questions), computes
   `scorePercentage = floor(earnedPoints * 100 / totalPoints)`, and sets
   `passed = scorePercentage >= quiz.passingScore`.
8. A second submit attempt on an already-`SUBMITTED` attempt returns `409`;
   the frontend then fetches the stored result instead.
9. Result panel shows score percentage, passed/not-passed badge, and
   per-question correct/incorrect feedback.
10. Learner can click "Retake quiz" after viewing a submitted result — this
    calls the same start/resume endpoint, which creates a brand-new
    `QuizAttempt` since the previous one is no longer `IN_PROGRESS`. The
    earlier `SUBMITTED` attempt is never overwritten.
11. The collapsible attempt-history panel lists every past attempt (number,
    date, status, score where applicable) with "Resume" for `IN_PROGRESS`
    attempts and "View result" for `SUBMITTED` ones — old submitted attempts
    remain viewable after a retake.

**Backend endpoints:**
- `GET /api/v1/learner/courses/{courseId}/quizzes`, `GET /api/v1/learner/quizzes/{quizId}`
- `POST /api/v1/learner/quizzes/{quizId}/attempts`
- `POST /api/v1/learner/quiz-attempts/{attemptId}/submit`
- `GET /api/v1/learner/quiz-attempts/{attemptId}`
- `GET /api/v1/learner/quizzes/{quizId}/attempts`

**Frontend routes:** `/dashboard/courses/:courseId` (Quizzes tab)

**Result:** A `SUBMITTED` `QuizAttempt` with computed score and per-question correctness, plus a retake path and a full attempt-history list per quiz. There is no pagination on the attempt-history endpoint — it returns the full list for the quiz.

**Evidence:** `assets/screenshots/04-course-player-quiz-result.png` (demo/report screenshot, not an automated test)

---

## 7. Learner Saves Courses to Wishlist

**Actor:** Authenticated Learner (`ROLE_LEARNER`)

**Goal:** Save a course for later without enrolling.

**Main steps:**
1. On the public course detail page, an eligible learner clicks "Save for
   later" (guests see a "Sign in to save this course" link instead; the
   action is gated on `isAuthenticated && roles.includes('ROLE_LEARNER')`
   since `WishlistController` is `@PreAuthorize("hasRole('LEARNER')")`).
2. Saved state is derived, not server-flagged per course: the frontend
   fetches `GET /api/v1/wishlist?size=200` and builds a `Set` of saved
   course IDs.
3. Adding an already-saved course returns `409`, treated as "already saved"
   (no error shown); removing an already-gone course returns `404`, treated
   as "already removed".
4. Learner can review and remove saved courses from the Saved Courses
   dashboard page.

**Backend endpoints:**
- `GET /api/v1/wishlist` (LEARNER)
- `POST /api/v1/wishlist/course/{courseId}` (LEARNER)
- `DELETE /api/v1/wishlist/course/{courseId}` (LEARNER)

**Frontend routes:** `/courses/:courseId` (save action), `/dashboard/saved-courses` (review/remove)

**Result:** A `WishlistItem` row per saved course. Saving does not enroll the learner or unlock course content; wishlist and enrollment are independent.

---

## 8. User Edits Profile from Settings

**Actor:** Authenticated User (learner and/or instructor)

**Goal:** Update personal/profile information.

**Main steps:**
1. User opens `/dashboard/settings`.
2. Learner section loads current values via `GET /api/v1/learner-profile/me`
   and submits changes (`displayName`, `bio`, `profileImageUrl`) via
   `PATCH`.
3. If the user's `availableProfiles` includes `INSTRUCTOR`, an instructor
   section is also shown, editing (`bio`, `expertise`, `experience`,
   `motivation`) via `PATCH /api/v1/instructor-profile/me`.
4. **No profile id ever appears in the URL or request body for these
   endpoints** — the backend resolves the target profile from the
   authenticated principal, so a user can only ever edit their own profile.

**Backend endpoints:**
- `GET/PATCH /api/v1/learner-profile/me` (authenticated; self-edit only)
- `PATCH /api/v1/instructor-profile/me` (INSTRUCTOR; self-edit only)

**Frontend routes:** `/dashboard/settings`

**Result:** Updated `LearnerProfile` and/or `InstructorProfile` fields, scoped strictly to the authenticated user's own record.

**Evidence:** `assets/screenshots/mobile-settings.png` (mobile viewport) (demo/report screenshot, not an automated test)

---

## 9. Learner Issues and Views a Course Completion Certificate

**Actor:** Enrolled Learner (own certificates only)

**Goal:** Obtain a certificate of completion once a course is finished, and view it later.

**Main steps:**
1. Learner completes every lesson in an enrolled course (see workflow 5);
   `Enrollment.progressPercentage` reaches 100%.
2. The course player (`CoursePlayerPage`) renders a certificate panel once
   `progressPercentage === 100`. The panel checks `GET
   /api/v1/learner/certificates` to see whether a certificate for this course
   already exists.
3. If none exists, the learner clicks "Issue certificate", which calls
   `POST /api/v1/learner/certificates/course/{courseId}/issue`. The backend
   validates `Enrollment.status = COMPLETED` and creates a `Certificate` row
   (idempotent: a repeat call returns the existing certificate with `200`
   instead of creating a duplicate).
4. On success, the panel shows a "View certificate" link to
   `/dashboard/certificates/:certificateId`.
5. The same certificate is also reachable later from `/dashboard/certificates`
   (the certificates list page), which calls `GET
   /api/v1/learner/certificates` and links each card to its certificate view.
6. The learner dashboard (`/dashboard`) also reads `GET
   /api/v1/learner/certificates` directly and renders a Certificates section
   with the same loading/error/empty states; each card on the dashboard links
   to the same `/dashboard/certificates/:certificateId` view route.
7. `CertificateViewPage` calls `GET
   /api/v1/learner/certificates/{certificateId}` and renders a full-screen,
   printable certificate document with a "Print / Save as PDF" button
   (browser `window.print()` — no server-side PDF generation).

**Error handling:** Issuing for a non-`COMPLETED` enrollment returns `409`,
surfaced in the panel as an accessible (`role="alert"`) message. A certificate
not found, or not owned by the caller, returns `404` on the view page.

**Backend endpoints:**
- `POST /api/v1/learner/certificates/course/{courseId}/issue` (LEARNER; self-scoped; idempotent)
- `GET /api/v1/learner/certificates` (LEARNER; self-scoped)
- `GET /api/v1/learner/certificates/{certificateId}` (LEARNER; self-scoped)

**Frontend routes:** `/dashboard/courses/:courseId` (certificate panel, Lessons area), `/dashboard` (Certificates section on the learner dashboard), `/dashboard/certificates` (list), `/dashboard/certificates/:certificateId` (full-screen view, outside `DashboardLayout`)

**Result:** A `Certificate` row created on first issuance, read-only afterward. Issuance is a manual, learner-triggered action from the course player — there is no automatic issuance on completion. The certificate backend itself was not changed by this workflow's UI integration.

---

## 10. Instructor Schedules a Live Session; Learner Joins

**Actor:** Approved Instructor (scheduling) and Enrolled Learner (joining)

**Goal:** Run an instructor-led live session via Jitsi, restricted to learners enrolled in the course.

**Main steps:**
1. Instructor opens `/instructor/live-sessions` and clicks "Schedule live session", choosing one of their own courses, a title, optional description, start/end time, and optional max participants.
2. Backend validates that the instructor owns the target course (`403` if not) and creates a `LiveSession` (`status = SCHEDULED`), generating a Jitsi room URL (`https://meet.jit.si/learnova-live-<secure-random>`).
3. The new session appears in the instructor's own session list (`GET /api/v1/instructor/live-sessions`), with an "Open meeting link" action and a "Cancel session" action while `SCHEDULED`.
4. A learner with an ACTIVE or COMPLETED enrollment in that course sees the session on `/dashboard/live-sessions` via `GET /api/v1/learner/live-sessions/upcoming`. This response intentionally omits `meetingUrl`/`meetingRoomName` — learners never see the meeting link before joining, and learners not enrolled in the course never see the session at all.
5. Learner clicks "Join". Backend (`POST /api/v1/learner/live-sessions/{sessionId}/join`) validates the learner's enrollment (`404` if not enrolled) and the session's status (`409` if cancelled), records a `SessionAttendance` row idempotently (a duplicate join does not create a second row), and returns the Jitsi meeting URL.
6. Frontend opens the returned URL in a new browser tab (`window.open(..., '_blank', 'noopener,noreferrer')`) — there is no iframe embedding and no Jitsi JWT/JaaS integration in v1.
7. Instructor can cancel a `SCHEDULED` session at any time via `POST /api/v1/instructor/live-sessions/{sessionId}/cancel`, after which learner join attempts return `409`.

**Backend endpoints:**
- `POST /api/v1/instructor/courses/{courseId}/live-sessions` (INSTRUCTOR; ownership-checked)
- `GET /api/v1/instructor/live-sessions` (INSTRUCTOR; own sessions)
- `POST /api/v1/instructor/live-sessions/{sessionId}/cancel` (INSTRUCTOR; own session)
- `GET /api/v1/learner/live-sessions/upcoming` (LEARNER; enrollment-filtered)
- `POST /api/v1/learner/live-sessions/{sessionId}/join` (LEARNER; enrollment-gated; idempotent attendance)

**Frontend routes:** `/instructor/live-sessions` (instructor schedule/list/cancel, under `InstructorLayout`), `/dashboard/live-sessions` (learner upcoming list + join, under `ProtectedRoute`)

**Result:** A `LiveSession` row (`SCHEDULED` or `CANCELLED`) and, after a learner joins, a `SessionAttendance` row. The meeting itself is hosted entirely by Jitsi; the platform's responsibility ends at scheduling, access control, and attendance recording. There is no `/leave` endpoint, no recurring sessions, no reminders, and no past-session history view in v1. The instructor nav exposes "Live sessions" in both the desktop row (`hidden md:flex`) and the mobile row (`md:hidden`) in `InstructorLayout`, alongside "Courses"; `/instructor/live-sessions` is reachable through in-app navigation across viewports.

---

## 11. Approved Instructor Switches Active Profile

**Actor:** Approved Instructor (a user with `INSTRUCTOR` in `availableProfiles`)

**Goal:** Toggle the active profile between `LEARNER` and `INSTRUCTOR` and land on the corresponding area, with the backend as the source of truth for which profile is active.

**Main steps:**
1. On `/dashboard`, `DashboardLayout`'s sidebar renders a profile-switch card for approved instructors only (`showProfileSwitchCard = isApprovedInstructor`).
2. The instructor clicks "Switch to instructor". The button calls `useProfileSwitch().switchTo('INSTRUCTOR')` (`src/hooks/useProfileSwitch.ts`).
3. The hook calls `switchActiveProfile('INSTRUCTOR')` (`src/api/profile.ts`), which performs `POST /api/v1/profile/switch` with `{ profileType: 'INSTRUCTOR' }`.
4. Backend (`ProfileSwitchController` → `ProfileSwitchService`) validates the request via `ProfileAccessService.canUseProfile()` and returns `{ activeProfile, availableProfiles }` on success, or `403` if the profile is not available to the caller.
5. On success, the hook updates `AuthContext`'s active profile and navigates to `/instructor/courses` (mapped via `PROFILE_ROUTE`).
6. `InstructorRoute` independently re-checks `isAuthenticated` + `availableProfiles` includes `'INSTRUCTOR'` before rendering the instructor shell — the switch call does not bypass this guard.
7. To switch back, the instructor clicks "Back to learner dashboard" in `InstructorLayout`'s topbar, which calls the same hook with `'LEARNER'`, hits the same endpoint, updates `AuthContext`, and navigates to `/dashboard`.
8. A third entry point reaches the same flow: on `/dashboard/settings`, the approved-instructor application panel's "Go to teaching area" action also calls `useProfileSwitch().switchTo('INSTRUCTOR')`, routing through the identical hook → endpoint → `AuthContext` update → navigation sequence as steps 2–5.

**Backend endpoints:**
- `POST /api/v1/profile/switch` (authenticated; validated against `ProfileAccessService.canUseProfile()`)

**Frontend routes:** `/dashboard` (switch-to-instructor trigger, `DashboardLayout`) ↔ `/instructor/courses` (switch-to-learner trigger, `InstructorLayout`); `/dashboard/settings` (alternate switch-to-instructor trigger, `SettingsPage`)

**Error handling:** A `403` from the backend (requested profile not available) is caught by `useProfileSwitch` and rendered as an inline, accessible (`role="alert"`) message in the triggering component (`DashboardLayout`, `InstructorLayout`, or `SettingsPage`); the user remains on the current page and no navigation occurs.

**Result:** `AuthContext.activeProfile` reflects the backend-confirmed profile; the user lands on the matching area. All three UI entry points — `DashboardLayout`'s switch card, `InstructorLayout`'s back-to-learner action, and `SettingsPage`'s "Go to teaching area" action — are now backend-backed through the same `useProfileSwitch` hook.

---

## 12. Learner Uploads a Profile Image

**Actor:** Authenticated Learner

**Goal:** Replace the profile photo shown on their own learner profile.

**Main steps:**
1. Learner opens `/dashboard/settings` and selects an image file in the photo
   uploader.
2. Frontend validates the file client-side (type/size hints) before sending
   it.
3. Frontend submits the file as `multipart/form-data` (field name `file`) to
   `POST /api/v1/learner-profile/me/image`; the target profile is always the
   caller's own, resolved from the authenticated principal.
4. Backend (`MediaValidator`) rejects an empty file, a disallowed content
   type (only `image/jpeg`, `image/png`, `image/webp` are accepted), or a
   file over the configured size limit with `400 Bad Request` before any
   Cloudinary call is made.
5. On a valid file, the backend uploads it to Cloudinary via
   `CloudinaryMediaStorageService` and receives back a secure URL and a
   public id.
6. The backend stores the new image URL and `profileImagePublicId` on the
   caller's `LearnerProfile`. If a previous `profileImagePublicId` existed,
   the backend deletes that old Cloudinary asset; a deletion failure is
   logged but does not fail the request, since the new upload already
   succeeded.
7. Frontend updates the photo preview from the response.

**Backend endpoints:**
- `POST /api/v1/learner-profile/me/image` (authenticated; self-resolved, no profile id in URL)

**Frontend routes:** `/dashboard/settings`

**Result:** `LearnerProfile.profileImageUrl` and `profileImagePublicId` updated. Live QA against real Cloudinary credentials (cloud `dnd5pu5me`) confirmed the upload persists and renders correctly after a page reload. On replacement, Cloudinary's deterministic `learner-{profileId}` public-ID naming means the new upload overwrites the same asset in place — the explicit delete-previous-asset step only fires when the public ID changes, which it does not under this naming scheme. Cloudinary dashboard verification (the web console) was not performed.

---

## 13. Instructor Uploads a Course Thumbnail

**Actor:** Approved Instructor (owner only)

**Goal:** Replace the thumbnail image shown for one of their own courses.

**Main steps:**
1. Instructor opens `/instructor/courses` and edits an existing course
   (EDIT mode only — create mode has no `courseId` yet, so it remains
   URL-only).
2. Instructor selects an image file in the thumbnail uploader.
3. Frontend validates the file client-side (type/size hints) before sending
   it.
4. Frontend submits the file as `multipart/form-data` (field name `file`) to
   `POST /api/v1/instructor/courses/{courseId}/thumbnail`.
5. Backend verifies the caller owns the course (`403` for another
   instructor's course), then runs the same `MediaValidator` checks as the
   learner profile-image flow (empty file, disallowed MIME type, oversized
   file → `400` before any Cloudinary call).
6. On a valid file, the backend uploads it to Cloudinary and stores the
   returned secure URL and `thumbnailPublicId` on the `Course`. If a
   previous `thumbnailPublicId` existed, the backend deletes that old
   Cloudinary asset; deletion failure is logged and non-fatal.
7. Frontend updates the thumbnail preview from the response.

**Backend endpoints:**
- `POST /api/v1/instructor/courses/{courseId}/thumbnail` (INSTRUCTOR; ownership-checked)

**Frontend routes:** `/instructor/courses` (EDIT mode)

**Result:** `Course.thumbnailUrl` and `thumbnailPublicId` updated. Live QA against real Cloudinary credentials (cloud `dnd5pu5me`) confirmed the new thumbnail persists after reload and renders correctly on both the public catalog card and the course detail page. As with the learner profile-image flow, replacement uploads reuse a deterministic `course-{id}` public ID, so the upload overwrites the existing asset in place rather than triggering the explicit-delete branch. Cloudinary dashboard verification (the web console) was not performed.

---

## 14. Learner Onboarding

**Actor:** Newly-registered or returning Learner whose onboarding is not yet complete

**Goal:** Capture learning preferences (or explicitly skip) once, then never see the wizard again.

**Main steps:**
1. Learner registers and logs in as usual (workflow 1). `LearnerProfile.onboardingCompleted` starts `false` by default (DB-level default, see note below).
2. Learner reaches `/dashboard`. `LearnerDashboard` checks `user.learnerOnboardingCompleted` in a `useEffect`; if it is `false`, it redirects (`replace`) to `/onboarding`. This check lives on the dashboard index page itself, not in a router-level guard, so it only fires when the dashboard index route renders.
3. `OnboardingPage` loads existing preferences (`GET /api/v1/learner-profile/me/preferences`) and the category list (`GET /api/v1/categories`), then walks the learner through 4 steps: learning goal, pace (preferred level + weekly goal minutes), preferred categories (up to 8), and a review step.
4. **Finish onboarding** (last step): saves preferences via `PUT /api/v1/learner-profile/me/preferences`, then calls `POST /api/v1/learner-profile/me/onboarding/complete`, then navigates to `/dashboard`.
5. **Skip for now** (available on every step): calls `POST /api/v1/learner-profile/me/onboarding/complete` directly, **without** saving any preferences first, then navigates to `/dashboard`. This exists specifically so skipping cannot leave the learner stuck in a redirect loop back to `/onboarding`.
6. Completing onboarding is idempotent: calling the complete endpoint again after it is already `true` returns `200` and keeps the original `onboardingCompletedAt` timestamp unchanged.
7. If a learner who has already completed onboarding navigates to `/onboarding` directly, the page detects `user.learnerOnboardingCompleted === true` and renders an "You're all set" confirmation panel with a link back to `/dashboard`, instead of the wizard.
8. Preferences saved (or left as defaults) during onboarding are the same record editable later from `/dashboard/settings` (workflow 8's Settings page, "Learning preferences" section) — onboarding and Settings read and write the same `LearningPreference` row.

**Backend endpoints:**
- `GET /api/v1/learner-profile/me/preferences`, `PUT /api/v1/learner-profile/me/preferences`
- `POST /api/v1/learner-profile/me/onboarding/complete`
- `GET /api/v1/auth/me` (exposes `learnerOnboardingCompleted` for the dashboard-entry check)

**Frontend routes:** `/onboarding` (under `ProtectedRoute`, rendered outside the `/dashboard` route group so `DashboardLayout` does not wrap it) → `/dashboard` (index route, under `ProtectedRoute` + `DashboardLayout`)

**Result:** `LearnerProfile.onboardingCompleted = true` with `onboardingCompletedAt` set; learning preferences are saved only if the learner chose "Finish onboarding" rather than "Skip for now". The learner reaches `/dashboard` either way and is not redirected again. No recommendation or personalization currently consumes these preferences — they are stored for future use only.

**DB-default note:** `LearnerProfile.onboardingCompleted` is `@Column(nullable = false, columnDefinition = "boolean default false")`. Without the explicit DB-level default, Hibernate's `ddl-auto: update` cannot add this `NOT NULL` column to a Postgres `learner_profiles` table that already has rows — existing rows would have no value to satisfy the new constraint. This was found and fixed during manual QA against a non-empty local database.
