# Known Limitations

This document consolidates the platform's current known gaps for the PFA
report, so that `project-overview.md` and `core-workflows.md` can stay
focused on what is implemented. Source: `CURRENT_STATE.md` "Known Gaps" and
"Still mocked or placeholder" sections, cross-checked against the router and
controllers.

## Live Sessions

Live sessions are implemented end-to-end as a Jitsi-backed v1 (backend
`livesession` module + `LiveSessionsPage`/`InstructorLiveSessionsPage` — see
`core-workflows.md` §10 and `use-cases.md` UC-31–UC-35), with these real,
code-backed limitations:

- **No custom video infrastructure.** The platform generates and validates
  access to a Jitsi room (`https://meet.jit.si/learnova-live-<secure-random>`);
  it does not implement WebRTC, signaling, or media handling itself.
- **No iframe embedding.** The frontend opens the Jitsi URL in a new browser
  tab (`window.open(..., '_blank', 'noopener,noreferrer')`); the meeting is
  not embedded inside the Learnova UI.
- **No Jitsi authentication, JWT, or JaaS.** The meeting room is the public,
  unauthenticated `meet.jit.si` service. Once a learner has received the
  meeting URL from the join endpoint, the platform has no further control
  over who else might join if the room name were guessed — the unguessable,
  securely-random room name is the v1 security boundary, not a Jitsi-side
  access control.
- **No `/leave` endpoint.** Attendance is recorded on join only; there is no
  corresponding leave/duration tracking.
- **No recurring sessions, reminders, or past-session history view.** Each
  session is a single one-off `LiveSession` row; nothing notifies learners
  before a session starts, and there is no UI to browse sessions that have
  already happened.

## Certificates

Certificates are implemented end-to-end (backend module + `CertificatesPage`,
`CertificateViewPage`, and a certificate panel in `CoursePlayerPage` — see
`core-workflows.md` §9 and `use-cases.md` UC-28), with these real, code-backed
limitations:

- **Issuance is manual, not automatic.** A learner must explicitly click
  "Issue certificate" from the course player's certificate panel; there is no
  background job or completion hook that creates a `Certificate` row without
  that click.
- **Certificate availability depends on course completion and, if present,
  passing every published quiz.** The panel only appears once
  `Enrollment.progressPercentage` reaches 100%; the backend additionally
  rejects issuance with `409` if the course has any PUBLISHED quiz without
  at least one SUBMITTED, passed attempt for it (DRAFT/ARCHIVED quizzes
  never block, and a course with no published quizzes only needs lesson
  completion).
- **No PDF generation, download, sharing, QR code, or revocation.** The
  certificate view page offers only a browser "Print / Save as PDF" button
  (`window.print()`); there is no server-rendered PDF, no email/LinkedIn
  share action, no QR/verification code, and no revoke or regenerate flow.
- **No certificate-issuance trigger from anywhere except the course player.**
  `CertificatesPage` (the certificates list) and the learner dashboard's
  Certificates section both only read existing certificates via
  `GET /api/v1/learner/certificates` — neither offers an issuance action.

## Course content and player

- Lesson content (v1): a lesson may carry one content type — `TEXT`,
  `VIDEO`, `PDF`, or `LINK` — set by the instructor in the content builder.
  `TEXT` renders inline in the course player; `VIDEO`/`PDF`/`LINK` render as
  a labeled external link that opens the resource in a new browser tab, not
  an embedded player. A lesson with no content type set is a structural
  placeholder with no body.
  - **No lesson file uploads and no Cloudinary lesson attachments** —
    `VIDEO`/`PDF`/`LINK` content is always a link to an externally hosted
    resource; the platform does not host or upload lesson files.
  - **No embedded video playback and no arbitrary iframe embeds** — URL-based
    lesson content always opens as a plain outbound link.
  - **No rich text editor** — `TEXT` content is authored as plain text in
    the instructor content form.
- No public syllabus/section previews, instructor bio endpoint, course
  duration, or lesson count on the public catalog/detail pages (no backend
  contract for any of these).
- Media upload exists as a Cloudinary-backed v1 (backend
  `media` module: `MediaStorageService`/`CloudinaryMediaStorageService`/
  `MediaValidator`) for two surfaces only: learner profile image
  (`POST /api/v1/learner-profile/me/image`) and instructor course thumbnail
  (`POST /api/v1/instructor/courses/{courseId}/thumbnail`), both
  multipart/form-data with field name `file`. Credentials are backend-only —
  no direct/unsigned frontend-to-Cloudinary upload exists.
  - **Instructor profile image upload is not implemented** — `InstructorProfile`
    has no image URL field.
  - Live upload against real Cloudinary credentials (cloud `dnd5pu5me`) has
    been verified for the learner profile image and instructor course
    thumbnail flows, including replacement uploads — see
    `testing-summary.md` for the QA evidence. **Cloudinary dashboard
    verification (the web console itself) has not been performed**; QA
    relied on rendered URLs, reload persistence, and catalog/detail
    rendering instead.
  - Replacement uploads reuse deterministic public-ID naming
    (`course-{id}` / `learner-{id}`), so Cloudinary overwrites the existing
    asset in place rather than creating an orphan; the explicit
    delete-previous-asset code path only fires when the public ID itself
    changes, which does not happen under this naming scheme.
  - Course thumbnail upload is wired in course **edit** mode only — create
    mode remains URL-only since no `courseId` exists before the course is
    created.
  - No lesson attachments and no certificate PDF/media storage — these
    remain plain-URL or non-existent as documented elsewhere in this file.
- No question/answer-option or section/lesson ordering — items are always
  appended; there is no drag-reorder.

## Quizzes

- No pagination on the attempt-history endpoint
  (`GET /api/v1/learner/quizzes/{quizId}/attempts`) — it returns the full,
  unbounded list of the caller's attempts for a quiz, ordered purely by
  `startedAt` descending with no other sort/filter options.
- Per-quiz attempt-history fetches on the Quizzes tab are non-blocking and
  fail silently per card — a failed fetch for one quiz leaves that card's
  history empty without surfacing an error or blocking the rest of the tab.
- No timers/duration fields on quizzes.
- No quiz analytics or learner-results dashboard for instructors.
- v1 supports exactly one selected option per question — no multi-select /
  partial-credit question type.
- No unpublish or restore-from-archived flow for quizzes; publish is
  one-directional (`DRAFT → PUBLISHED`), archive is terminal.

## Wishlist

- No per-course wishlist-status endpoint; saved state is derived client-side
  from a single `GET /api/v1/wishlist?size=200` call (a v1 page-size cap).
- No automatic removal from the wishlist after enrollment — wishlist and
  enrollment are independent at both backend and frontend layers.
- Catalog cards (`CourseCatalogCard`) intentionally do not yet show
  save/unsave controls; the wishlist action exists only on the course detail
  page and the saved-courses dashboard page.

## Onboarding and learning preferences

- **No recommendation engine** — learning preferences (`learningGoal`, `preferredLevel`, `weeklyGoalMinutes`, `preferredCategoryIds`) are captured during onboarding and editable later in Settings, but nothing in the backend or frontend currently reads these values back to recommend, rank, or filter courses. They are stored for future personalization, not used by any feature today.
- **No reminder/notification scheduling** — `weeklyGoalMinutes` is stored but no reminder, email, or notification system is wired to it.
- **No personalization analytics** — there is no dashboard or report surfacing aggregate learner preference data to instructors or admins.
- **Skip-for-now does not save preferences** — choosing "Skip for now" in the onboarding wizard marks onboarding complete (`POST /api/v1/learner-profile/me/onboarding/complete`) without calling the preferences endpoint at all; only "Finish onboarding" (the last step) saves preferences via `PUT /api/v1/learner-profile/me/preferences`.
- **Onboarding redirect is page-scoped, not a router guard** — `LearnerDashboard` (the `/dashboard` index page) redirects to `/onboarding` from a `useEffect` when `learnerOnboardingCompleted === false`. This is not implemented as a route-level guard comparable to `ProtectedRoute`/`InstructorRoute`/`AdminRoute`, so it only fires when the dashboard index route itself renders.

## Profiles and admin

- The profile switcher is wired end-to-end across all three UI entry
  points: `DashboardLayout`'s instructor switch card, `InstructorLayout`'s
  "back to learner dashboard" action, and `SettingsPage`'s "Go to teaching
  area" action (in the approved-instructor application panel) all call
  `POST /api/v1/profile/switch` via `src/hooks/useProfileSwitch.ts`. No
  remaining navigation-only entry point exists for profile switching.
- No admin user-management capability beyond instructor approvals and
  category creation; there is no broader admin console.

## Frontend automated testing

- Frontend automated tests are minimal and cover selected high-value flows
  only: `useProfileSwitch` success/failure, the learner dashboard's
  certificate-section states, the `learnerQuizzes` API client's
  attempt-history contract, the `CoursePlayer` quiz history UI extracted
  into `QuizCard`/`AttemptHistory`, and the `liveSessions` API client /
  `LiveSessionsPage` UI (27 tests total, via Vitest + React Testing Library +
  jsdom — see `testing-summary.md`).
- No broad frontend integration, visual, or accessibility automation suite
  exists yet.
- The extracted quiz card and attempt-history pieces
  (`frontend/src/features/dashboard/components/courseQuiz/QuizCard.tsx`)
  are component-tested, but the full `CoursePlayer` route-level flow (tab
  switching, data fetching, answer selection, submit, the Lessons tab, and
  the certificate panel) remains manually QA'd, not automated. Do not
  present `CoursePlayer` as having full route-level coverage.

## Dashboard

- The learner dashboard's previous fabricated "Upcoming Live Sessions"
  section (a local placeholder, distinct from the now-implemented
  `LiveSessionsPage` at `/dashboard/live-sessions`) and hardcoded certificate
  list have been removed; the dashboard's Certificates section now reads
  real data via `GET /api/v1/learner/certificates`.
- `ProgressPage` shows enrollment-level progress only — no per-lesson
  breakdown view, and no weekly-activity or learning-time analytics module
  exists. Its fake weekly-activity strip (`WEEK_ACTIVITY`) has been removed;
  the page now shows only real enrollment-derived data (summary counts and
  in-progress/completed/not-started course lists) and no fabricated
  activity claims of any kind.
