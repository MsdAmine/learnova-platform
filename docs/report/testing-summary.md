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
  wishlist add, stale-state reconciliation on remove).

## Known Untested / Placeholder Areas

These areas have little or no test coverage and/or are not feature-complete,
and should not be presented as verified in the report:

- **Certificates backend** — does not exist in this codebase (owned by
  another developer); no tests apply.
- **Live sessions backend** — does not exist; `LiveSessionsPage` is a
  frontend placeholder only.
- **Quiz attempt history** — no list/review-of-past-attempts feature exists,
  so there is nothing to test here beyond the single-attempt flow already
  covered by `LearnerQuizIntegrationTest`.
- **Rich lesson body/media** — the course player's lesson content area is a
  placeholder panel; there is no video/rich-text rendering to test.
- **Ordering/reordering** — sections, lessons, questions, and answer options
  have no explicit ordering or reorder capability; not applicable for
  testing.
