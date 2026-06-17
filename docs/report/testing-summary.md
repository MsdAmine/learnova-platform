# Testing Summary

This document summarizes the test evidence available for the Learnova
backend and the verification style used on the frontend. It does not invent
pass/fail counts — exact current numbers should be obtained by running the
test suite (see **How to get exact numbers** below).

## Backend Test Suite

The backend test suite (`backend/src/test/java`) currently contains **27
test classes** (file count from `backend/src/test/java/**/*.java`), organized
by module. Tests run against an in-memory H2 database in
PostgreSQL-compatibility mode (`src/test/resources/application-test.yml`) —
no external database is required.

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
- `LearnerQuizIntegrationTest`

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

## Frontend Verification Style

The frontend (`frontend/`) does not have an automated test suite as of this
report. Verification is currently manual and tooling-based:

- **Lint** — `npm run lint` (ESLint) catches static issues (unused
  variables, hook rule violations, etc.).
- **Build** — `npm run build` runs the TypeScript compiler check followed by
  the production Vite build; this is the primary type-correctness gate.
- **Browser QA** — manual exercise of each workflow in a running dev server
  (`npm run dev`), covering the golden path and the documented edge/error
  states (e.g., 404 on not-enrolled course content, 409 on duplicate
  wishlist add, stale-state reconciliation on remove). Screenshots captured
  during this manual QA are stored in `docs/report/assets/screenshots/` as
  report/demo evidence, not as automated test artifacts.

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
  change — the claims above are manual QA only, not covered by an
  automated test suite (the frontend has none, per the section above).
  The backend behavior it depends on is covered by the automated
  `CertificateIntegrationTest` listed above.

## Known Untested / Placeholder Areas

These areas have little or no test coverage and/or are not feature-complete,
and should not be presented as verified in the report:

- **Live sessions backend** — does not exist; `LiveSessionsPage` is a
  frontend placeholder only.
- **Certificate issuance UI** — covered by manual browser QA only (see
  above); no automated frontend component test exists for the certificate
  panel or certificate pages.
- **Quiz attempt history** — no list/review-of-past-attempts feature exists,
  so there is nothing to test here beyond the single-attempt flow already
  covered by `LearnerQuizIntegrationTest`.
- **Rich lesson body/media** — the course player's lesson content area is a
  placeholder panel; there is no video/rich-text rendering to test.
- **Ordering/reordering** — sections, lessons, questions, and answer options
  have no explicit ordering or reorder capability; not applicable for
  testing.
