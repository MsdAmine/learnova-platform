# Testing Summary

This document summarizes the test evidence available for the Learnova
backend and the verification style used on the frontend. It does not invent
pass/fail counts — exact current numbers should be obtained by running the
test suite (see **How to get exact numbers** below).

## Backend Test Suite

The backend test suite (`backend/src/test/java`) currently contains **28
test classes** (file count from `backend/src/test/java/**/*.java`), organized
by module. Tests run against an in-memory H2 database in
PostgreSQL-compatibility mode (`src/test/resources/application-test.yml`) —
no external database is required. A full `./mvnw test` run currently reports
**205 tests, 0 failures, 0 errors**.

### Test categories

**Auth / security** (7 classes)
- `AuthRegistrationIntegrationTest`
- `AuthLoginIntegrationTest`
- `CurrentUserIntegrationTest`
- `JwtAuthenticationFilterUnitTest`
- `AccountStatusSecurityTest`
- `AdminInstructorProfileSecurityTest`
- `UserRepositoryTest`

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

**Certificates** (1 class)
- `CertificateIntegrationTest` — covers issuance on a completed enrollment,
  idempotent re-issuance, rejection on an incomplete enrollment (`409`),
  rejection with no enrollment (`404`), per-learner list scoping, ownership
  checks on certificate retrieval, certificate code uniqueness, and
  unauthenticated access (`401`)

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
- **Test files and coverage** (27 tests total):
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
- **Test setup** — `frontend/src/test/setup.ts` now also runs
  `afterEach(cleanup)` (from `@testing-library/react`) to unmount rendered
  components between tests and prevent DOM leakage across test files.
- **Latest verification run** — `npm run lint` passed, `npm run build`
  passed, `npm run test` passed (27 tests, 0 failures).

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
    enrollment): an accessible (`role="alert"`) error message is shown in
    the panel.
- No automated frontend component test was added for this UI in this
  change — the claims above are manual QA only; the certificate panel is
  not covered by the frontend automated test harness described above.
  The backend behavior it depends on is covered by the automated
  `CertificateIntegrationTest` listed above.

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
- **Rich lesson body/media** — the course player's lesson content area is a
  placeholder panel; there is no video/rich-text rendering to test.
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
