# API Summary

Concise API reference grouped by module, generated directly from the
controllers under `backend/src/main/java`. No endpoint listed here is
invented — each was confirmed against its `@RestController` source.

Swagger UI (live, interactive): `http://localhost:8080/swagger-ui/index.html`

---

## Auth

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Create a `User` + auto-created `LearnerProfile` |
| POST | `/api/v1/auth/login` | Public | Authenticate and issue a JWT |
| GET | `/api/v1/auth/me` | Authenticated | Return current user, roles, available profiles, instructor approval status, **`learnerOnboardingCompleted`** |

## Profile

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/profile/switch` | Authenticated | Switch the caller's active profile type (validated against the caller's `availableProfiles`; `403` if not available); consumed by the frontend via `src/api/profile.ts` → `src/hooks/useProfileSwitch.ts`, called from `DashboardLayout`'s instructor switch card, `InstructorLayout`'s "back to learner" action, and `SettingsPage`'s "Go to teaching area" action |
| GET | `/api/v1/learner-profile/me` | Authenticated | Get the caller's own learner profile (self-resolved, no id in URL); response includes `onboardingCompleted` and `onboardingCompletedAt` |
| PATCH | `/api/v1/learner-profile/me` | Authenticated | Update `displayName`, `bio`, `profileImageUrl` on the caller's own learner profile |
| POST | `/api/v1/learner-profile/me/onboarding/complete` | Authenticated | Mark the caller's learner onboarding complete; idempotent — repeat calls keep the first `onboardingCompletedAt` and return `200` unchanged; does not touch learning preferences |
| GET | `/api/v1/learner-profile/me/preferences` | Authenticated | Get the caller's learning preferences (`learningGoal`, `preferredLevel`, `weeklyGoalMinutes`, `preferredCategoryIds`); returns an all-null default response if none saved yet |
| PUT | `/api/v1/learner-profile/me/preferences` | Authenticated | Upsert the caller's learning preferences; validates `preferredCategoryIds` (max 8, must exist) and `weeklyGoalMinutes` (30–1200) |
| POST | `/api/v1/instructor-profile/request` | Authenticated | Submit an instructor profile request (status starts `PENDING`) |
| GET | `/api/v1/instructor-profile/me` | Authenticated | Get the caller's own instructor profile |
| PATCH | `/api/v1/instructor-profile/me` | INSTRUCTOR | Update `bio`, `expertise`, `experience`, `motivation` on the caller's own instructor profile (self-resolved, no id in URL) |
| POST | `/api/v1/learner-profile/me/image` | Authenticated | Upload the caller's own learner profile image to Cloudinary (`multipart/form-data`, field name `file`); self-resolved, no id in URL |

**Onboarding completion field:** `learnerOnboardingCompleted` (boolean, `GET /api/v1/auth/me`) and `onboardingCompleted` / `onboardingCompletedAt` (`GET`/`PATCH`/`POST .../onboarding/complete` on `/api/v1/learner-profile/me`) are the only places the onboarding flag is exposed. The underlying `LearnerProfile.onboardingCompleted` column has a DB-level default (`columnDefinition = "boolean default false"`), required for Hibernate `ddl-auto: update` to add a `NOT NULL` boolean column onto an already-populated Postgres `learner_profiles` table.

## Instructor Approval (Admin)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/admin/instructor-profiles/pending` | ADMIN | List instructor profiles awaiting review |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/approve` | ADMIN | Approve a pending instructor profile — **grants instructor access** |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/reject` | ADMIN | Reject a pending instructor profile with a reason |

## Public Catalog

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/courses` | Public | List published courses |
| GET | `/api/v1/courses/{courseId}` | Public | Get a single published course's catalog detail |
| GET | `/api/v1/categories` | Public | List all categories |
| GET | `/api/v1/categories/{id}` | Public | Get a single category |
| POST | `/api/v1/categories` | ADMIN | Create a category |

## Enrollment

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/courses/{courseId}/enroll` | Authenticated | Enroll the caller in a published course (drafts blocked) |
| GET | `/api/v1/learner/enrollments` | Authenticated | List the caller's enrollments |
| GET | `/api/v1/learner/enrollments/{courseId}` | Authenticated | Get the caller's enrollment for one course |

## Learner Content / Progress

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/learner/courses/{courseId}/content` | Authenticated; enrollment-gated (ACTIVE/COMPLETED) | Get section/lesson structure with per-lesson progress and lesson content (`contentType`, `textContent`, `contentUrl`, `durationSeconds`); `TEXT` renders inline in the player, `VIDEO`/`PDF`/`LINK` render as an external link |
| PATCH | `/api/v1/lessons/{lessonId}/progress` | LEARNER; enrollment-gated | Update a lesson's completion/position/time-spent; syncs `Enrollment.progressPercentage` atomically |
| GET | `/api/v1/lessons/course/{courseId}/progress` | LEARNER; enrollment-gated | Get aggregate course progress |

## Wishlist

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/wishlist` | LEARNER | Paged list of the caller's saved courses |
| POST | `/api/v1/wishlist/course/{courseId}` | LEARNER | Save a course (409 if already saved) |
| DELETE | `/api/v1/wishlist/course/{courseId}` | LEARNER | Remove a saved course (404 if not saved) |

## Instructor Course Management

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/instructor/courses` | INSTRUCTOR | List the caller's own courses (all statuses) |
| POST | `/api/v1/instructor/courses` | INSTRUCTOR | Create a course (starts `DRAFT`) |
| PATCH | `/api/v1/instructor/courses/{courseId}` | INSTRUCTOR; ownership-checked | Update course fields |
| POST | `/api/v1/instructor/courses/{courseId}/publish` | INSTRUCTOR; ownership-checked | `DRAFT → PUBLISHED` |
| POST | `/api/v1/instructor/courses/{courseId}/archive` | INSTRUCTOR; ownership-checked | `DRAFT`/`PUBLISHED → ARCHIVED` |
| POST | `/api/v1/instructor/courses/{courseId}/thumbnail` | INSTRUCTOR; ownership-checked | Upload a course thumbnail to Cloudinary (`multipart/form-data`, field name `file`); `403` for another instructor's course |

## Instructor Content Builder

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/instructor/courses/{courseId}/content` | INSTRUCTOR; ownership-checked | List sections + lessons for own course |
| POST | `/api/v1/instructor/courses/{courseId}/sections` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Create a section |
| PATCH | `/api/v1/instructor/courses/sections/{sectionId}` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Update section title |
| DELETE | `/api/v1/instructor/courses/sections/{sectionId}` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Delete section (cascades lessons) |
| POST | `/api/v1/instructor/courses/sections/{sectionId}/lessons` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Create a lesson; accepts `title`, optional `contentType` (`TEXT`/`VIDEO`/`PDF`/`LINK`), `textContent` (TEXT only), `contentUrl` (URL types only, external http(s) link), `durationSeconds` |
| PATCH | `/api/v1/instructor/courses/lessons/{lessonId}` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Update lesson title and content fields |
| DELETE | `/api/v1/instructor/courses/lessons/{lessonId}` | INSTRUCTOR; ownership-checked; 409 if ARCHIVED | Delete a lesson |

## Instructor Quiz Authoring

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/instructor/courses/{courseId}/quizzes` | INSTRUCTOR | List quizzes for own course |
| POST | `/api/v1/instructor/courses/{courseId}/quizzes` | INSTRUCTOR | Create a quiz (`DRAFT`) |
| GET | `/api/v1/instructor/courses/quizzes/{quizId}` | INSTRUCTOR | Get quiz detail with questions + options |
| PUT | `/api/v1/instructor/courses/quizzes/{quizId}` | INSTRUCTOR | Update quiz fields |
| PATCH | `/api/v1/instructor/courses/quizzes/{quizId}/publish` | INSTRUCTOR | `DRAFT → PUBLISHED` (validates questions/options/correct answer exist) |
| PATCH | `/api/v1/instructor/courses/quizzes/{quizId}/archive` | INSTRUCTOR | Archive a quiz (terminal; no reverse transition) |
| POST | `/api/v1/instructor/courses/quizzes/{quizId}/questions` | INSTRUCTOR | Add a question (`MULTIPLE_CHOICE` or `TRUE_FALSE`) |
| PUT | `/api/v1/instructor/courses/questions/{questionId}` | INSTRUCTOR | Update a question |
| DELETE | `/api/v1/instructor/courses/questions/{questionId}` | INSTRUCTOR | Delete a question (cascades options) |
| POST | `/api/v1/instructor/courses/questions/{questionId}/options` | INSTRUCTOR | Add an answer option |
| PUT | `/api/v1/instructor/courses/options/{optionId}` | INSTRUCTOR | Update an answer option (incl. `isCorrect` flag) |
| DELETE | `/api/v1/instructor/courses/options/{optionId}` | INSTRUCTOR | Delete an answer option |

## Learner Quiz-Taking

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/learner/courses/{courseId}/quizzes` | LEARNER; enrollment-gated | List `PUBLISHED` quizzes for an enrolled course (no `isCorrect` exposed) |
| GET | `/api/v1/learner/quizzes/{quizId}` | LEARNER; enrollment-gated | Get learner-safe quiz detail (no `isCorrect` exposed) |
| POST | `/api/v1/learner/quizzes/{quizId}/attempts` | LEARNER; enrollment-gated | Start or idempotently resume an `IN_PROGRESS` attempt; creates a new attempt (retake) if the existing one is already `SUBMITTED` |
| POST | `/api/v1/learner/quiz-attempts/{attemptId}/submit` | LEARNER; own attempt only | Submit answers, compute score and pass/fail; 409 if already submitted |
| GET | `/api/v1/learner/quiz-attempts/{attemptId}` | LEARNER; own attempt only | Retrieve a submitted attempt's result with per-question correctness |
| GET | `/api/v1/learner/quizzes/{quizId}/attempts` | LEARNER; enrollment-gated | List the caller's own attempts for a quiz, most-recent-first; `SUBMITTED` attempts include per-question results, `IN_PROGRESS` attempts never expose correctness; no pagination |

## Live Sessions

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/instructor/courses/{courseId}/live-sessions` | INSTRUCTOR; ownership-checked (`403` for another instructor's course) | Schedule a session for an owned course; generates a Jitsi room (`https://meet.jit.si/learnova-live-<secure-random>`) and returns it in the response |
| GET | `/api/v1/instructor/live-sessions` | INSTRUCTOR | List the caller's own sessions across all owned courses |
| POST | `/api/v1/instructor/live-sessions/{sessionId}/cancel` | INSTRUCTOR; own session only | Cancel a `SCHEDULED` session (`status → CANCELLED`) |
| GET | `/api/v1/learner/live-sessions/upcoming` | LEARNER | List upcoming sessions for courses where the caller has an ACTIVE or COMPLETED enrollment; response omits `meetingUrl`/`meetingRoomName` |
| POST | `/api/v1/learner/live-sessions/{sessionId}/join` | LEARNER; enrollment-gated | Validate enrollment (`404` if not enrolled) and session status (`409` if cancelled), record attendance idempotently, and return the Jitsi meeting URL — **the only response that ever includes `meetingUrl`** |

> v1 is Jitsi-only (`MeetingProvider.JITSI`). No `/leave` endpoint exists. No
> recurring sessions, reminders, or past-session history endpoint exist.

## Certificates

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/v1/learner/certificates/course/{courseId}/issue` | LEARNER; self-scoped | Issue a certificate for a `COMPLETED` enrollment, requiring every published course quiz to have a passed attempt (`201` first issue, `200` idempotent repeat without re-validation; `409` if lessons incomplete or a published quiz is unpassed) |
| GET | `/api/v1/learner/certificates` | LEARNER; self-scoped | List the caller's own certificates |
| GET | `/api/v1/learner/certificates/{certificateId}` | LEARNER; self-scoped | Get one certificate owned by the caller (`404` if not found or not owned) |

## Admin

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/api/v1/admin/instructor-profiles/pending` | ADMIN | (see Instructor Approval above) |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/approve` | ADMIN | (see Instructor Approval above) |
| POST | `/api/v1/admin/instructor-profiles/{profileId}/reject` | ADMIN | (see Instructor Approval above) |
| POST | `/api/v1/categories` | ADMIN | Create a category |

> Admin currently has no broader user-management capability beyond instructor
> approvals and category creation.
