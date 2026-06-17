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
   course content builder.
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

**Result:** Per-lesson completion state persisted; enrollment-level progress percentage kept in sync; note that the lesson content area itself is a placeholder panel — there is no rich text/video rendering of lesson bodies.

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
6. `CertificateViewPage` calls `GET
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

**Frontend routes:** `/dashboard/courses/:courseId` (certificate panel, Lessons area), `/dashboard/certificates` (list), `/dashboard/certificates/:certificateId` (full-screen view, outside `DashboardLayout`)

**Result:** A `Certificate` row created on first issuance, read-only afterward. Issuance is a manual, learner-triggered action from the course player — there is no automatic issuance on completion. The certificate backend itself was not changed by this workflow's UI integration.
