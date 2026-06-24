# Screenshot Inventory (Desktop + Mobile, by Role)

Report-ready screenshot set for the Learnova PFA report, captured from a running local
dev instance (frontend `npm run dev` on `http://localhost:5173`, backend
`./mvnw spring-boot:run` on `http://localhost:8080`) using Playwright MCP browser
automation.

This set supersedes the older flat/ungrouped screenshot files at the root of this
folder (`01-public-catalog.png`, `02-learner-dashboard.png`, `03-course-player-lessons.png`,
`04-course-player-quiz-result.png`, `05-instructor-content-builder.png`,
`06-admin-instructor-approvals.png`, `mobile-course-player.png`, `mobile-settings.png`)
and the desktop-only numbered set (`01-public-catalog-desktop.png` … `16-settings-profile-image-desktop.png`)
from a prior capture pass. Those files are left in place since cleaning up
`docs/report/README.md` references was out of scope for this task, but the
`desktop/` and `mobile/` subfolders below are the current, complete, organized set.

## Viewports

- **Desktop:** 1440×900
- **Mobile:** 390×844

## Accounts used

| Account | Role | Password | Notes |
|---|---|---|---|
| `demo.learner@learnova.dev` | Learner | `Password123!` | Seeded demo account |
| `demo.instructor@learnova.dev` | Instructor (Sofia Martin) | `Password123!` | Seeded demo account, owns "Cloud Infrastructure Essentials" (course 19) |
| `demo.admin@learnova.dev` | Admin | `Password123!` | Seeded demo account |
| `report.demo.learner@learnova.dev` | Learner (new) | `Password123!` | Created via real `/register` flow during this session, to capture the onboarding wizard (steps 1–4) on desktop since the seeded demo learner had already completed onboarding. Also used to submit a real instructor application captured on `desktop/admin/01`. |
| `mobile.demo.learner@learnova.dev` | Learner (new) | `Password123!` | Created via real `/register` flow during this session, to capture the onboarding wizard step on mobile and to submit a second real instructor application captured on `mobile/admin/01`. |

All five accounts are real backend-persisted users created through the actual
registration/login flows — no fabricated frontend data, no direct database edits.

## Data side effects from this capture session

Several real, additive actions were taken through the actual app flows (no direct
database edits, no fabricated data) specifically because the seeded demo data had
empty states that needed to be filled to produce report-useful screenshots:

1. **Course completion + certificate issuance (demo.learner, course 19 "Cloud
   Infrastructure Essentials")** — all 3 lessons were marked complete via the real
   "Mark as complete" button, then a certificate was issued via the real "Issue
   certificate" action. This is irreversible demo-account state: the learner's
   enrollment is now 100%/COMPLETED and certificate id 1 exists.
2. **Lesson content authoring (demo.instructor, course 19)** — the two lessons that
   had no content yet ("Networking basics in the cloud", "Managing cost and scaling")
   were given real content via the instructor content builder: one TEXT lesson body,
   one Video (external) URL. This was necessary because the seeded course only had
   placeholder text on lesson 1 and no content at all on lessons 2–3.
3. **Quiz authoring + publishing (demo.instructor, course 19)** — no course in the
   seed data had any quiz at all. A quiz ("Cloud Infrastructure Knowledge Check") with
   2 questions (1 multiple-choice, 1 true/false), each with answer options and a
   marked-correct option, was created and published via the real instructor quiz
   builder.
4. **Quiz attempt (demo.learner, course 19)** — the learner started and submitted an
   attempt on the quiz from (3), answering both questions correctly (100%, Passed),
   to capture the in-progress and passed-result quiz states.
5. **Wishlist save (demo.learner)** — "Building REST APIs with Spring Boot" (course 1)
   was saved via the real "Save for later" action on the public course detail page,
   because Saved Courses was otherwise empty.
6. **New account registrations** — `report.demo.learner@learnova.dev` and
   `mobile.demo.learner@learnova.dev` were created via the real `/register` flow
   specifically to capture the onboarding wizard, since the seeded demo learner had
   `learnerOnboardingCompleted = true` with no UI path to reset it.
7. **Instructor applications + one approval** — both new accounts above submitted real
   instructor applications via Settings → Instructor (because the instructor-approvals
   queue was otherwise empty). The application from `report.demo.learner` was approved
   by `demo.admin` (captured at both the pending and confirm-step states before
   approving). The application from `mobile.demo.learner` was left pending to also
   document the mobile pending-queue state.

No existing seeded course, lesson, or quiz was deleted. No live session was
created/cancelled/joined beyond what already existed in seed data (two real
scheduled Jitsi-backed sessions were already present and captured as-is).

## Known data caveats

- Course thumbnails are stable Unsplash photo URLs from the seed data; no images were
  added or changed.
- Instructor live-session screenshots show real Jitsi meeting URLs
  (`https://meet.jit.si/learnova-live-<random>`). Per the live-sessions design, the
  unguessable room name is itself the v1 access boundary; these are disposable demo
  rooms, not production secrets.
- The "live seeion react" / "adsasd" session titles are pre-existing real seed/QA data
  from earlier manual testing, not fabricated for this session.

## Screens skipped (not implemented) and why

- **Instructor course create/edit modal "Edit" variant** — only the Create form was
  fully exercised; the Edit-course modal is the same component, so a separate
  screenshot was judged redundant and skipped.
- **Admin dashboard, admin users page, admin course/category moderation pages** — not
  implemented. The router (`frontend/src/router/index.tsx`) only defines
  `/admin/instructor-approvals` under `/admin`. No other admin surface exists to
  capture.
- **Instructor "main landing page"** — there is no separate instructor dashboard/index
  route; `/instructor` has no index child, so `InstructorCoursesPage` at
  `/instructor/courses` is the de facto landing surface and was captured as such.
- **Mobile admin navigation drawer** — `AdminLayout` (like `InstructorLayout`) does not
  use a collapsible drawer at any viewport; it's a single top bar with no nav links
  besides "Back to learner dashboard" (only one admin route exists). No drawer screen
  exists to capture.
- **Mobile course content builder "Add a section" / lesson "URL content type" variant
  screenshot** — covered once each in the desktop set; mobile inventory focuses on the
  TEXT lesson-edit form (the more common content type) to avoid duplicating the same
  form chrome twice for marginal value.
- **Quiz tab "failed" result state** — only a "Passed" (100%) result was captured,
  since the same quiz only had two real questions and creating a deliberately-wrong
  second attempt was judged unnecessary noise; the per-question correct/incorrect
  feedback UI is still fully visible in the passed-result screenshot.

## Inventory

### desktop/shared

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-landing-page.png` | `/` | Public landing page, hero, category browse, how-it-works | Guest | None |
| `02-course-catalog.png` | `/courses` | Public course catalog with filters | Guest | None |
| `03-course-detail.png` | `/courses/1` | Public course detail for "Building REST APIs with Spring Boot" | Guest | None |
| `04-login-page.png` | `/login` | Login form | Guest | None |
| `05-register-page.png` | `/register` | Registration form | Guest | None |

### desktop/learner

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-dashboard.png` | `/dashboard` | Learner dashboard with enrolled course + certificate | demo.learner | None (reflects effects #1 above) |
| `02-my-courses.png` | `/dashboard/courses` | My Courses list | demo.learner | None |
| `03-course-player-lessons.png` | `/dashboard/courses/19` (Lessons tab) | Lesson content (TEXT) with course outline | demo.learner | Reflects effect #2 |
| `04-course-player-completed.png` | `/dashboard/courses/19` | 100% complete state with "Issue certificate" panel | demo.learner | Reflects effect #1 |
| `05-progress.png` | `/dashboard/progress` | Progress page | demo.learner | None |
| `06-certificates-list.png` | `/dashboard/certificates` | Certificates list with 1 issued certificate | demo.learner | Reflects effect #1 |
| `07-certificate-view.png` | `/dashboard/certificates/1` | Full certificate view page | demo.learner | Reflects effect #1 |
| `08-live-sessions.png` | `/dashboard/live-sessions` | Upcoming live session with Join action | demo.learner | None (pre-existing real session) |
| `09-saved-courses.png` | `/dashboard/saved-courses` | Saved courses list | demo.learner | Reflects effect #5 |
| `10-settings.png` | `/dashboard/settings` | Settings — My profile section | demo.learner | None |
| `11-onboarding-already-completed.png` | `/onboarding` | "You're all set" state for an already-onboarded account | demo.learner | None |
| `12-onboarding-step1-goal.png` | `/onboarding` | Step 1 of 4 — learning goal | report.demo.learner | New account registered for this capture (effect #6) |
| `13-onboarding-step2-pace.png` | `/onboarding` | Step 2 of 4 — preferred level / weekly goal | report.demo.learner | None |
| `14-onboarding-step3-categories.png` | `/onboarding` | Step 3 of 4 — preferred categories | report.demo.learner | None |
| `15-onboarding-step4-review.png` | `/onboarding` | Step 4 of 4 — review and finish | report.demo.learner | None |
| `16-quiz-tab-not-started.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz tab, not-started state | demo.learner | Reflects effect #3 |
| `17-quiz-in-progress.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz attempt in progress, both answers selected | demo.learner | None |
| `18-quiz-result-passed.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz result: 100%, Passed, per-question feedback | demo.learner | Reflects effect #4 |

### desktop/instructor

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-courses-list.png` | `/instructor/courses` | Teaching courses list (Draft + Published badges) | demo.instructor | None |
| `02-create-course-modal.png` | `/instructor/courses` | Create course modal | demo.instructor | None (cancelled, no course created) |
| `03-content-builder.png` | `/instructor/courses/19/content` | Content builder, sections/lessons, all 3 lessons populated | demo.instructor | Reflects effect #2 |
| `04-lesson-edit-text.png` | `/instructor/courses/19/content` | Lesson edit form, TEXT content type | demo.instructor | None |
| `05-lesson-edit-url.png` | `/instructor/courses/19/content` | Lesson edit form, Video (URL) content type | demo.instructor | None (cancelled, not saved in this exact form state) |
| `06-quiz-create-form.png` | `/instructor/courses/19/quizzes` | Create quiz form | demo.instructor | Reflects effect #3 (in progress) |
| `07-quiz-question-form.png` | `/instructor/courses/19/quizzes` | Add question form | demo.instructor | Reflects effect #3 (in progress) |
| `08-quiz-management.png` | `/instructor/courses/19/quizzes` | Published quiz with 2 questions + options | demo.instructor | Reflects effect #3 |
| `09-quiz-edit-form.png` | `/instructor/courses/19/quizzes` | Edit quiz metadata form | demo.instructor | None (cancelled) |
| `10-live-sessions.png` | `/instructor/live-sessions` | Scheduled live sessions list | demo.instructor | None (pre-existing real sessions) |
| `11-schedule-live-session-form.png` | `/instructor/live-sessions` | Schedule live session modal | demo.instructor | None (cancelled, no session created) |
| `12-settings-instructor-profile.png` | `/dashboard/settings?section=instructor` | Instructor profile section in Settings | demo.instructor | None |

### desktop/admin

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-instructor-approvals-pending.png` | `/admin/instructor-approvals` | Pending instructor request with full application detail | demo.admin | Reflects effect #7 (request from report.demo.learner) |
| `02-instructor-approvals-confirm.png` | `/admin/instructor-approvals` | "Approve this instructor request?" confirmation step | demo.admin | None (request was approved immediately after this screenshot, effect #7) |

### mobile/shared

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-landing-page.png` | `/` | Public landing page | Guest | None |
| `02-course-catalog.png` | `/courses` | Public course catalog | Guest | None |
| `03-course-detail.png` | `/courses/1` | Public course detail | Guest | None |
| `04-login-page.png` | `/login` | Login form | Guest | None |
| `05-register-page.png` | `/register` | Registration form | Guest | None |
| `06-mobile-nav-menu.png` | `/` | Mobile hamburger nav menu (open) | Guest | None |

### mobile/learner

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-dashboard.png` | `/dashboard` | Learner dashboard | demo.learner | None |
| `02-nav-drawer.png` | `/dashboard` | Mobile learner nav drawer (open) | demo.learner | None |
| `03-course-player-lessons.png` | `/dashboard/courses/19` (Lessons tab) | Lesson content, mobile layout with collapsible outline | demo.learner | Reflects effects #1, #2 |
| `04-course-player-quiz-tab.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz result (Passed, attempt history) on mobile | demo.learner | Reflects effects #3, #4 |
| `05-progress.png` | `/dashboard/progress` | Progress page | demo.learner | None |
| `06-certificates-list.png` | `/dashboard/certificates` | Certificates list | demo.learner | Reflects effect #1 |
| `07-live-sessions.png` | `/dashboard/live-sessions` | Live sessions list | demo.learner | None |
| `08-saved-courses.png` | `/dashboard/saved-courses` | Saved courses list | demo.learner | Reflects effect #5 |
| `09-settings.png` | `/dashboard/settings` | Settings — My profile | demo.learner | None |
| `10-onboarding-categories.png` | `/onboarding` | Step 3 of 4 — preferred categories, mobile layout | mobile.demo.learner | New account registered for this capture (effect #6) |

### mobile/instructor

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-courses-list.png` | `/instructor/courses` | Teaching courses list (inline nav, no drawer needed) | demo.instructor | None |
| `02-content-builder.png` | `/instructor/courses/19/content` | Content builder, mobile layout | demo.instructor | None |
| `03-lesson-edit-form.png` | `/instructor/courses/19/content` | Lesson edit form (TEXT), mobile layout | demo.instructor | None (cancelled) |
| `04-quiz-management.png` | `/instructor/courses/19/quizzes` | Quiz management, mobile layout | demo.instructor | None |
| `05-live-sessions.png` | `/instructor/live-sessions` | Live sessions list, mobile layout | demo.instructor | None |

### mobile/admin

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-instructor-approvals.png` | `/admin/instructor-approvals` | Pending instructor request, mobile layout | demo.admin | Reflects effect #7 (request from mobile.demo.learner, left pending) |

## Totals

- desktop/shared: 5
- desktop/learner: 18
- desktop/instructor: 12
- desktop/admin: 2
- mobile/shared: 6
- mobile/learner: 10
- mobile/instructor: 5
- mobile/admin: 1
- **Total: 59 screenshots**
