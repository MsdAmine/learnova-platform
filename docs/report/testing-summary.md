# Testing Summary

This document summarizes the test evidence available for the Learnova
backend and the verification style used on the frontend. It does not invent
pass/fail counts — exact current numbers should be obtained by running the
test suite (see **How to get exact numbers** below).

## Backend Test Suite

The backend test suite (`backend/src/test/java`) currently contains **36
test classes** (file count from `backend/src/test/java/**/*.java`), organized
by module. Tests run against an in-memory H2 database in
PostgreSQL-compatibility mode (`src/test/resources/application-test.yml`) —
no external database is required. A full `./mvnw test` run previously
reported **241 tests, 0 failures, 0 errors**; the certificate quiz-eligibility
class added 10 more tests and the certificate PDF download class
(`CertificatePdfDownloadIntegrationTest`) added 4 more on top of that
baseline — see **How to get exact numbers** below to confirm the current
total.

### Test categories

**Auth / security** (7 classes)
- `AuthRegistrationIntegrationTest`
- `AuthLoginIntegrationTest`
- `CurrentUserIntegrationTest`
- `JwtAuthenticationFilterUnitTest`
- `AccountStatusSecurityTest`
- `AdminInstructorProfileSecurityTest`
- `UserRepositoryTest`

**Wishlist** (1 class)
- `WishlistIntegrationTest` (8 tests) — covers the per-course status endpoint
  returning `saved: true`/`false`; status requires authentication (`401`);
  status does not leak across learners (a learner cannot observe another
  learner's saved state); adding the same course twice returns `409`;
  removing a saved course drops it from status; enrolling in a saved course
  automatically removes it from the wishlist; enrolling in a course that was
  never saved still succeeds.

**Course lifecycle** (4 classes)
- `CourseLifecycleIntegrationTest`
- `CourseCatalogIntegrationTest`
- `InstructorCourseListIntegrationTest`
- `InstructorCourseAccessTest`

**Enrollment** (3 classes)
- `EnrollmentIntegrationTest`
- `EnrollmentErrorResponseRealServerTest`
- `LearnerCourseContentIntegrationTest`

**Lesson progress** (2 classes)
- `LessonProgressEnrollmentSyncIntegrationTest`
- `LessonProgressAccessControlIntegrationTest`

**Instructor content authoring** (1 class)
- `InstructorCourseContentIntegrationTest`

**Instructor quiz read/authoring** (1 class)
- `InstructorQuizReadIntegrationTest`

**Learner quiz attempts** (1 class)
- `LearnerQuizIntegrationTest` — covers listing/detail/start/submit/result
  for the original quiz-taking flow, plus attempt-history coverage added for
  retake and history support: empty history, retake history ordering
  (most-recent-first), no `isCorrect` leak on attempt-history responses,
  learner-scoped isolation (a learner cannot see another learner's
  attempts), non-enrolled learner → `404`, draft quiz → `404`, and
  unauthenticated access → `401`

**Profile editing / dual-profile** (6 classes)
- `LearnerProfileRegistrationIntegrationTest`
- `LearnerProfileServiceTest`
- `ProfileSwitchIntegrationTest`
- `InstructorProfileRequestIntegrationTest`
- `InstructorProfileUpdateIntegrationTest`
- `LearnerProfileUpdateIntegrationTest`

**Certificates** (3 classes)
- `CertificateIntegrationTest` — covers issuance on a completed enrollment,
  idempotent re-issuance, rejection on an incomplete enrollment (`409`),
  rejection with no enrollment (`404`), per-learner list scoping, ownership
  checks on certificate retrieval, certificate code uniqueness, and
  unauthenticated access (`401`)
- `CertificatePdfDownloadIntegrationTest` (4 tests) — covers the
  server-side certificate PDF download endpoint: the certificate owner can
  download the PDF (`200`, `application/pdf`, the rendered text contains the
  learner name, course title, and certificate code); a learner cannot
  download another learner's certificate PDF (`404`, not `403`, consistent
  with the existing certificate ownership pattern); requesting a PDF for a
  non-existent certificate returns `404`; an unauthenticated request returns
  `401`
- `CertificateQuizEligibilityIntegrationTest` (10 tests) — covers the
  assessment-aware eligibility rule: issuance succeeds once lessons are
  complete and every published quiz has a passed attempt; issuance is
  blocked (`409`, with a distinct message) when lessons are incomplete, when
  a published quiz was never attempted, and when a published quiz has only
  failed attempts; a later passed attempt after a failure unblocks issuance;
  DRAFT/ARCHIVED quizzes never block; a course with no published quizzes
  only needs lesson completion; all published quizzes must be passed when
  more than one exists; repeat issuance stays idempotent with no duplicate
  row; and a non-enrolled learner gets `404`

**Live sessions** (1 class)
- `LiveSessionIntegrationTest` — 10 tests covering: instructor can create a
  session for their own course (verifies `status = SCHEDULED`,
  `meetingProvider = JITSI`, a `meetingUrl` starting with
  `https://meet.jit.si/`, and a non-empty `meetingRoomName`); instructor
  cannot create a session for another instructor's course (`403`); learner
  sees only sessions for enrolled courses (a second course's session is
  excluded); a learner with no enrollments sees an empty upcoming-sessions
  list; a learner cannot join a session for a course they are not enrolled
  in (`404`); joining records attendance and returns the meeting URL;
  duplicate join is idempotent (exactly one `SessionAttendance` row after
  two joins); a cancelled session cannot be joined (`409`); an instructor
  can cancel their own scheduled session (`status → CANCELLED`); and three
  unauthenticated-request checks (create session, list upcoming sessions,
  join session) all return `401`.

**Media upload** (3 classes)
- `CloudinaryConfigTest` — unit coverage of the Cloudinary configuration wiring
- `CloudinaryMediaStorageServiceTest` — unit coverage of the storage-service adapter (Cloudinary client mocked)
- `MediaUploadIntegrationTest` — 10 tests covering: unauthenticated rejection
  of the learner profile image upload; learner can upload their own profile
  image; replacing a profile image deletes the previous Cloudinary public ID;
  invalid MIME type rejected; oversized file rejected; empty file rejected;
  an instructor can upload a thumbnail for their own course; cross-instructor
  thumbnail upload returns `403`; unauthenticated thumbnail upload rejected.
  Cloudinary itself is mocked — no real external calls are made.

**Learner onboarding and learning preferences** (2 classes)
- `LearnerOnboardingIntegrationTest` — covers: unauthenticated `POST .../onboarding/complete` and `GET .../me` both return `401`; a newly-registered learner has `onboardingCompleted: false` by default (on both the learner-profile and `/auth/me` responses); saving preferences then completing onboarding returns `onboardingCompleted: true` with a timestamp; completing onboarding with no preferences saved still succeeds; completion persists across a fresh `GET` (both endpoints); completing onboarding twice is idempotent and keeps the first `onboardingCompletedAt`; one learner's onboarding completion does not affect another learner's status
- `LearningPreferencesIntegrationTest` — covers: unauthenticated `GET`/`PUT` on the preferences endpoint both return `401`; a learner with no saved preferences gets an all-null default response; valid preferences save and persist across a `GET`; an empty category list is accepted; an invalid `learningGoal` enum value, `weeklyGoalMinutes` below 30 or above 1200, a non-existent category id, and more than 8 preferred categories all return `400`; one learner's preferences are not visible to or affected by another learner

**Application context** (1 class)
- `LearnovaBackendApplicationTests`

### How to get exact numbers

This document deliberately does not state a current pass/fail count, since
that number changes as the suite evolves. To get the current count, run from
`backend/`:

```bash
./mvnw test
```

Maven's Surefire summary at the end of the run reports the exact number of
tests run, failures, and skips.

**Quiz retake and attempt-history — backend test run (historical):**
- Full backend suite (`./mvnw test`) at the time of that change: **193 tests, 0 failures, 0 errors.** (See the top of this section for the current total, which now includes `LiveSessionIntegrationTest`.)
- `LearnerQuizIntegrationTest` additions specific to this feature: empty
  attempt history, retake creates a new attempt and history is ordered
  most-recent-first, attempt-history responses never leak `isCorrect`,
  attempt history is scoped to the requesting learner only, non-enrolled
  learner requesting attempt history → `404`, requesting attempt history for
  a `DRAFT` quiz → `404`, unauthenticated request → `401`.

## Frontend Automated Tests

The frontend (`frontend/`) has a minimal automated test harness using
**Vitest + React Testing Library + jsdom**.

- **Setup** — `frontend/vitest.config.ts` configures the `jsdom` environment
  and loads `frontend/src/test/setup.ts` (which imports
  `@testing-library/jest-dom/vitest`).
- **Scripts** — `npm run test` (`vitest run`, single pass) and
  `npm run test:watch` (`vitest`, watch mode).
- **Test files and coverage** (39 tests total):
  - `frontend/src/hooks/useProfileSwitch.test.tsx` — success path updates
    the active profile and navigates to `/instructor/courses`; failure path
    exposes an error and does not navigate or update the profile.
  - `frontend/src/features/dashboard/pages/LearnerDashboard.test.tsx` — the
    certificate section shows a loading skeleton (not fake data) while
    pending, an empty state when `getMyCertificates()` resolves to `[]`, and
    a real `/dashboard/certificates/:id` link when populated, with no
    "Download" action rendered.
  - `frontend/src/api/learnerQuizzes.test.ts` — `listQuizAttempts(quizId)`
    calls the correct endpoint path; `IN_PROGRESS` attempts never expose
    correctness/score data; `SUBMITTED` attempts carry score, pass state,
    and per-question results; `getQuizAttempt` calls the correct endpoint
    path.
  - `frontend/src/features/dashboard/components/courseQuiz/QuizCard.test.tsx`
    (8 tests) — `QuizCard` and `AttemptHistory` were extracted from
    `CoursePlayerPage` into
    `frontend/src/features/dashboard/components/courseQuiz/QuizCard.tsx` to
    make this UI directly testable. Covers: empty attempt-history state
    ("No attempts yet."); an in-progress attempt shows "In progress" status
    and a "Resume" action; a submitted attempt shows score/pass text (e.g.
    "80% · Passed") and a "View result" action; attempts render in the exact
    order passed via props (no implicit re-sorting); an in-progress attempt
    never renders score, pass state, or correctness text; `QuizCard` renders
    a "Retake quiz" action once the latest attempt is submitted; clicking
    "Retake quiz" calls `onStart` with the quiz id; clicking "View result"
    calls `onViewResult` with the attempt id.
  - `frontend/src/api/liveSessions.test.ts` — verifies the live-session API
    client calls the correct endpoint paths and methods: learner
    `listUpcomingLiveSessions()` (`GET /api/v1/learner/live-sessions/upcoming`)
    and `joinLiveSession(sessionId)` (`POST /api/v1/learner/live-sessions/{sessionId}/join`);
    instructor `getMyInstructorLiveSessions()` (`GET /api/v1/instructor/live-sessions`),
    `createInstructorLiveSession(courseId, payload)`
    (`POST /api/v1/instructor/courses/{courseId}/live-sessions`), and
    `cancelInstructorLiveSession(sessionId)`
    (`POST /api/v1/instructor/live-sessions/{sessionId}/cancel`).
  - `frontend/src/features/dashboard/pages/LiveSessionsPage.test.tsx` —
    covers the learner-facing live sessions page: loading skeleton, empty
    state, rendering upcoming sessions, the join action opening the
    returned Jitsi URL in a new tab, and the inline error path when join
    fails.
  - `frontend/src/api/profile.test.ts` — verifies the learner profile image
    upload API client posts to `POST /api/v1/learner-profile/me/image` as
    multipart/form-data.
  - `frontend/src/api/instructorCourses.test.ts` — verifies the course
    thumbnail upload API client posts to
    `POST /api/v1/instructor/courses/{courseId}/thumbnail` as
    multipart/form-data.
  - `frontend/src/features/dashboard/pages/SettingsPage.test.tsx` — covers
    the learner profile photo uploader: successful upload updates the
    preview, an invalid file type/size is rejected client-side with an
    accessible error and no network call, and a failed upload surfaces an
    inline accessible error.
  - `frontend/src/features/instructor/pages/InstructorCoursesPage.test.tsx`
    — covers the course thumbnail uploader in edit mode: successful upload
    updates the preview, an invalid file type/size is rejected client-side
    with an accessible error and no network call, and a failed upload
    surfaces an inline accessible error.
- **Test setup** — `frontend/src/test/setup.ts` now also runs
  `afterEach(cleanup)` (from `@testing-library/react`) to unmount rendered
  components between tests and prevent DOM leakage across test files.
- **Latest verification run** — `npm run lint` passed, `npm run build`
  passed, `npm run test` passed (39 tests, 0 failures).

**Known frontend test gaps:**
- No full `CoursePlayer` route-level/integration test — tab switching, data
  fetching, the Lessons tab, and the certificate panel are not tested at
  that level. Only the quiz-history UI extracted into `QuizCard`/
  `AttemptHistory` is component-tested (see above); the rest of
  `CoursePlayerPage` remains manual-QA only.
- No broad route-level or integration test suite.
- No automated accessibility test suite.

## Frontend Verification Style

Beyond the automated tests above, frontend verification also relies on
lint, build, and manual browser QA:

- **Lint** — `npm run lint` (ESLint) catches static issues (unused
  variables, hook rule violations, etc.).
- **Build** — `npm run build` runs the TypeScript compiler check followed by
  the production Vite build; this is the primary type-correctness gate.
- **Browser QA** — manual exercise of each workflow in a running dev server
  (`npm run dev`), covering the golden path and the documented edge/error
  states (e.g., 404 on not-enrolled course content, 409 on duplicate
  wishlist add, stale-state reconciliation on remove). Screenshots captured
  during this manual QA are stored in `docs/report/assets/screenshots/` as
  report/demo evidence, not as automated test artifacts. Manual browser QA
  remains the primary verification method for visual/accessibility
  concerns and for UI flows not yet covered by the automated tests above
  (e.g., the `CoursePlayer` quiz retake/history UI).

**Quiz retake and attempt-history UI — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test` passed (4 files, 17 tests, 0 failures), including the 8
  new `QuizCard.test.tsx` tests covering the extracted attempt-history and
  retake UI (see "Frontend Automated Tests" above).
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - No horizontal overflow on the Quizzes tab at the mobile (390×844) or
    tablet (768×1024) viewport.
  - Keyboard navigation reaches the "Retake quiz", "Resume", and "View
    result" actions with a visible focus state.
  - Correct answers remain hidden before submission, including inside the
    attempt-history panel's `IN_PROGRESS` rows.
  - Live quiz flow verified end-to-end: start, in-progress secrecy, submit,
    result panel, retake, and attempt-history ordering/states.
  - No console errors or warnings.
- `QuizCard`/`AttemptHistory` (the extracted attempt-history and retake UI)
  are now component-tested; the rest of `CoursePlayerPage` (tab switching,
  data fetching, Lessons tab, certificate panel) remains manual-QA only —
  see "Known frontend test gaps" above. The backend behavior the quiz UI
  depends on is covered by the `LearnerQuizIntegrationTest` additions above.

**Certificate issuance UI — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - Incomplete course (progress < 100%): certificate panel is absent from
    the course player.
  - Complete course (progress = 100%): certificate panel appears; "Issue
    certificate" successfully creates a certificate and switches the panel
    to "View certificate".
  - Existing certificate: opening the course player for an already-issued
    course shows the "View certificate" state directly (no re-issue button).
  - Backend mismatch / `409` (e.g., issuing for a not-yet-completed
    enrollment, or a completed enrollment with an unpassed published quiz):
    an accessible (`role="alert"`) error message is shown in the panel, and
    for the quiz-blocked case a "Go to Quizzes" button switches the course
    player to the Quizzes tab.
- No automated frontend component test was added for this UI in this
  change — the claims above are manual QA only; the certificate panel,
  including the "Go to Quizzes" button added for the quiz-blocked case, is
  not covered by the frontend automated test harness described above.
  The backend behavior it depends on is covered by the automated
  `CertificateIntegrationTest` and `CertificateQuizEligibilityIntegrationTest`
  listed above.

**Learner dashboard mock-content cleanup — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - No horizontal overflow at any of the three viewports.
  - No console errors or warnings during QA.
  - Empty certificate state (no certificates issued yet) rendered correctly
    on the dashboard's Certificates section.
  - Populated certificate state tested with a real, previously issued
    certificate — the dashboard card linked correctly to
    `/dashboard/certificates/:certificateId`.
  - Certificate card keyboard focus tested — cards are reachable via
    keyboard and show a visible focus state.
- These viewport/console/keyboard-focus claims are manual QA only and
  predate the frontend test harness. The dashboard's certificate-section
  loading, empty, and populated states are now additionally covered by
  `LearnerDashboard.test.tsx` (see "Frontend Automated Tests" above). The
  dashboard change did not touch any backend code or the certificate
  backend.

**Profile switcher UI — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - Learner-only user (no `INSTRUCTOR` in `availableProfiles`) does not see
    the profile-switch card in `DashboardLayout`'s sidebar.
  - Approved instructor sees the profile-switch card on `/dashboard` and the
    "Back to learner dashboard" action on `/instructor/*`.
  - Switch-to-instructor: clicking the sidebar control calls
    `POST /api/v1/profile/switch`, updates `AuthContext`, and routes to
    `/instructor/courses`.
  - Switch-back-to-learner: clicking the instructor topbar control calls the
    same endpoint and routes to `/dashboard`.
  - Refreshing the page after a switch preserves the active profile and
    route-guard behavior (re-derived from `/auth/me` on load, not from a
    stale local flag).
  - Simulated API failure renders an inline, accessible (`role="alert"`)
    error message in the triggering layout and does not navigate away.
  - No horizontal overflow introduced at any of the three viewports.
- These viewport/keyboard-focus claims are manual QA only and predate the
  frontend test harness. `useProfileSwitch`'s success and failure behavior
  is now additionally covered by `useProfileSwitch.test.tsx` (see "Frontend
  Automated Tests" above); the `DashboardLayout` and `InstructorLayout`
  call sites themselves remain manual-QA only. The backend behavior it
  depends on (`POST /api/v1/profile/switch`) is covered by the existing
  `ProfileSwitchIntegrationTest`.

**Settings profile-switch update — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - A learner-only user (no `INSTRUCTOR` in `availableProfiles`) does not see
    the "Go to teaching area" action on `/dashboard/settings`.
  - An approved instructor sees the "Go to teaching area" action in the
    Settings instructor-application panel.
  - Clicking the action calls `POST /api/v1/profile/switch` (via
    `useProfileSwitch().switchTo('INSTRUCTOR')`); success navigates to
    `/instructor/courses`.
  - A simulated API failure renders an inline, accessible (`role="alert"`)
    message in the Settings panel and does not navigate away.
  - Keyboard focus reaches the action and Enter activates it, matching the
    existing `Button` component's behavior.
  - No horizontal overflow introduced at any of the three viewports.
  - `DashboardLayout`'s switch card and `InstructorLayout`'s "back to
    learner dashboard" action continue to work unchanged.
- The Settings panel's own rendering/keyboard-focus claims remain manual QA
  only; no automated frontend component test exists for the Settings panel
  itself. The underlying `useProfileSwitch` hook it calls is covered by
  `useProfileSwitch.test.tsx` (see "Frontend Automated Tests" above). The
  backend behavior it depends on (`POST /api/v1/profile/switch`) is covered
  by the existing `ProfileSwitchIntegrationTest`; no backend code was
  modified for this change.

**Progress page mock-content cleanup — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test` passed (3 files, 9 tests, 0 failures) — no test in this run
  targets `ProgressPage` directly; the change removed a non-interactive
  local data array (`WEEK_ACTIVITY`) and its rendering component
  (`WeekStrip`), with no new logic to unit-test.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900), using
  a learner account enrolled in one course (to exercise the non-empty page
  state, not just the "no enrollments" empty panel):
  - No horizontal overflow at any of the three viewports.
  - No console errors at any of the three viewports.
  - The weekly activity strip no longer renders — the page goes directly
    from the real enrolled/in-progress/completed summary counts to the
    real in-progress/completed/not-started course lists.
  - Real enrollment data (summary counts and course lists) renders
    correctly and unchanged at every viewport.
- No replacement placeholder or "coming soon" panel was added — the section
  was removed outright, consistent with how the dashboard's earlier
  "Upcoming Live Sessions" and hardcoded certificate sections were handled
  (see "Learner dashboard mock-content cleanup" above).
- No dedicated automated `ProgressPage` test exists; these claims are
  manual QA only. No backend code was touched, and the certificate backend
  was not modified.

**Live sessions — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test` passed (27 tests, 0 failures), including
  `liveSessions.test.ts` and `LiveSessionsPage.test.tsx` (see "Frontend
  Automated Tests" above).
- Backend: `./mvnw test` passed (205 tests, 0 failures, 0 errors), including
  the 10 `LiveSessionIntegrationTest` scenarios (see "Backend Test Suite"
  above).
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - Instructor schedule: an approved instructor on `/instructor/live-sessions`
    can open the "Schedule live session" form, pick one of their own
    courses, and successfully create a session.
  - Learner sees and joins: an enrolled learner on `/dashboard/live-sessions`
    sees the scheduled session and can click "Join", which opens the Jitsi
    meeting URL in a new browser tab.
  - Non-enrolled learner is blocked: a learner without an enrollment in the
    session's course does not see the session in their upcoming list.
  - Cancel flow: the instructor can cancel a `SCHEDULED` session from
    `/instructor/live-sessions`, with inline confirmation; the session's
    status updates to `CANCELLED`.
  - No fake meeting links remain: the previous placeholder
    `meet.learnova.app` / `recordings.learnova.app` links are gone from the
    UI; all meeting URLs observed during QA were real `meet.jit.si` links
    returned by the backend.
  - No horizontal overflow at any of the three viewports on either the
    learner or instructor live-sessions page.
- These manual QA claims are evidence for this specific change; they
  complement, and do not replace, the automated coverage listed above.

**Instructor live-session mobile nav — manual verification:**
- `npm run lint` passed.
- `npm run build` passed.
- `npm run test` passed.
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - 390×844: the new mobile-only instructor nav row (`md:hidden`) is visible
    below the topbar and functional — both "Courses" and "Live sessions"
    links work, active nav state is visible, and `/instructor/live-sessions`
    is reachable via in-app navigation; no horizontal overflow.
  - 768×1024: the mobile nav row is hidden at the `md` breakpoint and the
    desktop nav row (`hidden md:flex`) is visible instead; no overflow.
  - 1440×900: desktop nav unchanged.
  - No new console errors from the instructor nav flows at any viewport.
- Only `frontend/src/features/instructor/components/InstructorLayout.tsx`
  was changed; no backend code and no certificate-related code was touched.

**Cloudinary media upload — manual verification (mocked, placeholder-credential pass):**
- Backend: `./mvnw test` passed (215 tests, 0 failures, 0 errors at the time
  of this pass), including the 10 `MediaUploadIntegrationTest` scenarios (see
  "Backend Test Suite" above; Cloudinary mocked, no real external calls).
- Frontend: `npm run lint` passed, `npm run build` passed, `npm run test`
  passed (35 tests, 0 failures), including `profile.test.ts`,
  `instructorCourses.test.ts`, `SettingsPage.test.tsx`, and
  `InstructorCoursesPage.test.tsx` (see "Frontend Automated Tests" above).
- Manual browser QA at three viewports (390×844, 768×1024, 1440×900):
  - With only placeholder Cloudinary credentials configured at the time, a
    valid image upload on both uploaders reached the Cloudinary call and
    failed cleanly with a `502` — expected given placeholder credentials, and
    superseded by the live QA pass below once real credentials were
    configured.
  - An invalid file type and an oversized file are both rejected
    client-side with an accessible error message and no network call made,
    on both uploaders.
  - Cross-instructor course thumbnail upload returns `403`.
  - No horizontal overflow at any of the three viewports.
  - No unexpected console errors.
- Instructor profile image upload was not exercised because it does not
  exist — `InstructorProfile` has no image URL field.

**Cloudinary media upload — live QA with real credentials (cloud `dnd5pu5me`):**
- Real Cloudinary credentials were configured for cloud `dnd5pu5me`; backend
  local config hardening for reading these from `backend/.env` (without
  sourcing unrelated JWT/DB values) was committed separately (`98203b2`).
- Backend: `./mvnw test` passed (222 tests, 0 failures, 0 errors). Cloudinary
  itself remains mocked in the automated suite — these are unit/integration
  tests, not the live-credentials QA evidence below.
- Frontend: `npm run lint`, `npm run build`, and `npm run test` all passed
  (35 tests, 0 failures).
- Live, real-Cloudinary manual QA at three viewports (390×844, 768×1024,
  1440×900):
  - Learner profile image upload succeeded; the rendered image URL was a
    real `https://res.cloudinary.com/dnd5pu5me/image/upload/.../learnova/profile-images/learner-70.png` asset.
  - Instructor course thumbnail upload succeeded for an owned course ("QA
    Quiz Course", id 13); the thumbnail preview updated immediately and
    persisted after a page reload; the public catalog card and the course
    detail page both rendered the uploaded thumbnail.
  - A replacement thumbnail upload succeeded; because Cloudinary overwrite
    uses deterministic public-ID naming (`course-{id}` / `learner-{id}`),
    the replacement overwrote the same asset rather than creating an orphan,
    and the explicit-delete-on-replacement branch did not fire — this is
    expected, since that branch only triggers when the public ID itself
    changes, not on every replacement.
  - Invalid file type and oversized file validation both still passed.
  - Unauthenticated upload returned `401`; non-instructor upload returned
    `403`; cross-instructor ownership is covered by the existing
    `MediaUploadIntegrationTest` integration test.
  - All browser upload requests went only to backend endpoints; the only
    direct browser-to-Cloudinary traffic observed was public `GET` requests
    to `res.cloudinary.com` for image display (no `api.cloudinary.com`
    upload call ever originated from the browser).
  - No Cloudinary secret appeared in frontend requests, browser console,
    the frontend bundle, or backend logs.
  - No horizontal overflow or unexpected console errors at any viewport.
- **Cloudinary dashboard verification (the Cloudinary web console itself)
  was not performed** during this pass — verification relied on the
  rendered URLs, reload persistence, and catalog/detail rendering above, not
  on inspecting the Cloudinary account dashboard directly.
- Data side effects from this QA pass: a `qa.other.instructor@learnova.dev`
  user (`ROLE_LEARNER`-only) was created for the non-instructor authorization
  check; course 13's thumbnail was changed twice, ending on the blue
  replacement image; learner 70's profile image was updated. These are
  QA-environment side effects, not application bugs.

### Manual QA: Learner Onboarding

The onboarding flow has no automated frontend tests; it was verified manually
across three viewports (390×844, 768×1024, 1440×900):

- Registration → first dashboard visit redirects to `/onboarding`.
- Step navigation (back/continue), step-2 weekly-goal-minutes validation,
  and category loading from the real backend (`GET /api/v1/categories`) all
  work as expected.
- Review step accurately reflects selections; "Finish onboarding" saves
  preferences and returns to `/dashboard` without a further redirect.
- "Skip for now" marks onboarding complete server-side (without saving
  preferences) and returns to `/dashboard`.
- Revisiting `/onboarding` after completion shows the "already completed"
  panel with a link back to `/dashboard`, instead of the wizard.
- Settings ("Learning preferences" section) correctly reflects preferences
  saved during onboarding.
- Sign-out continues to work after the onboarding flow.
- No layout overflow at any tested viewport; no console errors observed at
  1440×900.

## Known Untested / Placeholder Areas

These areas have little or no test coverage and/or are not feature-complete,
and should not be presented as verified in the report:

- **Live sessions** — backend covered by `LiveSessionIntegrationTest` (10
  scenarios); frontend covered by `liveSessions.test.ts` and
  `LiveSessionsPage.test.tsx` plus manual browser QA (see "Live sessions —
  manual verification" above). `InstructorLiveSessionsPage` itself
  (schedule form, cancel confirm) is not component-tested — covered by
  manual browser QA only.
- **Certificate issuance UI** — covered by manual browser QA only (see
  above); no automated frontend component test exists for the certificate
  panel or certificate pages.
- **Certificate PDF download UI** — `downloadCertificatePdf()`
  (`frontend/src/api/certificates.ts`) and the "Download PDF" actions on
  `CertificateViewPage` and `CertificatesPage` have no automated frontend
  test; coverage is manual browser QA only. The backend endpoint itself
  (`GET /api/v1/learner/certificates/{certificateId}/pdf`) is covered by
  `CertificatePdfDownloadIntegrationTest` (4 tests, see "Backend Test Suite"
  above).
- **Learner dashboard certificate display** — the loading/empty/populated
  states are covered by `LearnerDashboard.test.tsx` (see "Frontend
  Automated Tests" above); viewport/console/keyboard-focus behavior remains
  manual browser QA only.
- **Quiz attempt-history pagination** — the attempt-history endpoint has no
  pagination; this is untested because there is nothing to paginate, not
  because coverage is missing.
- **Quiz retake/attempt-history frontend UI** — the attempt-history panel
  and retake action were extracted into `QuizCard`/`AttemptHistory`
  (`frontend/src/features/dashboard/components/courseQuiz/QuizCard.tsx`) and
  are now component-tested by `QuizCard.test.tsx` (see "Frontend Automated
  Tests" above). The surrounding `CoursePlayerPage` (tab switching, data
  fetching, start/submit flow) is not component-tested and remains covered
  by manual browser QA only. The `learnerQuizzes` API client's
  attempt-history contract is covered by `learnerQuizzes.test.ts`.
- **Lesson content rendering** — the course player renders `TEXT` lesson
  content inline and `VIDEO`/`PDF`/`LINK` lesson content as an external
  resource link, but this rendering is not covered by an automated test;
  verification is manual browser QA only.
- **Live Cloudinary upload success** — verified by manual QA against real
  Cloudinary credentials (cloud `dnd5pu5me`) for the learner profile image
  and instructor course thumbnail flows (see "Cloudinary media upload — live
  QA with real credentials" above); automated tests still mock Cloudinary
  and do not exercise the real API. Cloudinary dashboard verification (the
  web console) was not performed. Instructor profile image upload has no
  test coverage because it is not implemented.
- **Ordering/reordering** — sections, lessons, questions, and answer options
  have no explicit ordering or reorder capability; not applicable for
  testing.
- **Progress page** — no automated frontend component test exists for
  `ProgressPage`; covered by manual browser QA only (see "Progress page
  mock-content cleanup" above). There is no weekly-activity/learning-time
  analytics module or backend endpoint to test against.
- **Profile switcher UI** — `useProfileSwitch`'s success/failure behavior is
  covered by `useProfileSwitch.test.tsx` (see "Frontend Automated Tests"
  above); its three call sites (`DashboardLayout`'s switch card,
  `InstructorLayout`'s "back to learner" action, and `SettingsPage`'s "Go to
  teaching area" action) have no automated component test and remain
  covered by manual browser QA only.
