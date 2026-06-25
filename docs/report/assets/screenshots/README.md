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
| `demo.instructor@learnova.dev` | Instructor (Sofia Martin) | `Password123!` | Seeded demo account, owns "Cloud Infrastructure Essentials" (course 19) and "Building REST APIs with Spring Boot" (course 1) |
| `demo.admin@learnova.dev` | Admin | `Password123!` | Seeded demo account |
| `report.demo.learner@learnova.dev` | Learner (new) | `Password123!` | Created via real `/register` flow during a prior capture pass, to capture the onboarding wizard (steps 1–4) on desktop since the seeded demo learner had already completed onboarding. Also used to submit a real instructor application captured on `desktop/admin/01`. |
| `mobile.demo.learner@learnova.dev` | Learner (new) | `Password123!` | Created via real `/register` flow during a prior capture pass, to capture the onboarding wizard step on mobile and to submit a second real instructor application captured on `mobile/admin/01`. |

All five accounts are real backend-persisted users created through the actual
registration/login flows — no fabricated frontend data, no direct database edits.

## Pre-refresh source change: merging PR #267

Before this refresh pass began, the "enriched public course detail" feature (syllabus
preview, section/lesson counts, estimated duration, instructor bio) was found to exist
only on an unmerged branch (`feat/public-course-detail`) with an already-open PR
(#267) — it was not yet on `main`. Per explicit user instruction, this PR was merged
into `main` as part of this session: one textual merge conflict in
`CourseService.java` (two independently-added import blocks) was resolved by combining
both blocks, verified with a clean backend compile, a clean frontend `tsc --noEmit`,
and a full `CourseCatalogIntegrationTest` pass (7/7), then pushed and merged via
`gh pr merge 267 --merge`. This is the one source-code change made during this
session; everything else below is screenshot assets plus the additive in-app data
mutations listed in the next section.

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
   one Video (external) URL.
3. **Quiz authoring + publishing (demo.instructor, course 19)** — a quiz ("Cloud
   Infrastructure Knowledge Check") with 2 questions (1 multiple-choice, 1
   true/false), each with answer options and a marked-correct option, was created and
   published via the real instructor quiz builder.
4. **Quiz attempt (demo.learner, course 19)** — the learner started and submitted an
   attempt on the quiz from (3), answering both questions correctly (100%, Passed).
5. **Wishlist save (demo.learner, course 1)** — "Building REST APIs with Spring Boot"
   was saved via the real "Save for later" action on the public course detail page,
   because Saved Courses was otherwise empty.
6. **New account registrations** — `report.demo.learner@learnova.dev` and
   `mobile.demo.learner@learnova.dev` were created via the real `/register` flow
   specifically to capture the onboarding wizard, since the seeded demo learner had
   `learnerOnboardingCompleted = true` with no UI path to reset it.
7. **Instructor applications + one approval** — both new accounts above submitted real
   instructor applications via Settings → Instructor. The application from
   `report.demo.learner` was approved by `demo.admin` (captured at both the pending
   and confirm-step states before approving). The application from
   `mobile.demo.learner` was left pending to also document the mobile pending-queue
   state.
8. **Accidental second wishlist save (demo.learner, course 2)** — while verifying a
   true logged-out state for the guest catalog screenshot, a stale demo.learner JWT
   was still in `localStorage`; clicking a catalog card's "Save" button before
   noticing this performed a real save of "React and TypeScript for Professional
   Dashboards" (course 2). Low-impact and additive; left in place and used
   productively for the new `desktop/learner/11-catalog-wishlist-controls.png`
   screenshot (shows one card "Saved"/pressed, others "Save").
9. **Quiz authoring + publishing (demo.instructor, course 1 "Building REST APIs with
   Spring Boot")** — no other enrolled-but-incomplete course had a quiz, which was
   needed to demonstrate the not-started / in-progress / not-passed / certificate-
   blocked states for the new quiz-eligibility-for-certificates feature. A quiz
   ("Spring Boot REST API Knowledge Check") with 2 questions (1 multiple-choice, 1
   true/false) was created and published.
10. **Course completion with a failed quiz attempt (demo.learner, course 1)** — all 5
    lessons were marked complete (100%), then the quiz from (9) was deliberately
    submitted with one wrong answer (50%, below the 70% passing score) to capture the
    "Not passed" result and the resulting "Pass all published quizzes before
    generating a certificate" blocked-certificate state. No certificate exists for
    course 1 as a result — this is intentional, real, and documents the
    quiz-eligibility gate working as designed.

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
- **Admin desktop/mobile screens were not re-verified against the new features** in
  this refresh pass — the instructor-approvals workflow is unaffected by the
  course-detail, suggestions, wishlist, certificate-PDF, or quiz-eligibility features,
  so the existing screenshots were left as-is to avoid redundant capture work.

## Inventory

### desktop/shared

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-landing-page.png` | `/` | Public landing page, hero, category browse, how-it-works | Guest | None |
| `02-course-catalog.png` | `/courses` | Public course catalog with filters, true guest (no wishlist controls, "Sign in to enroll") | Guest | None |
| `03-course-detail.png` | `/courses/19` | Public course detail for "Cloud Infrastructure Essentials" — **enriched**: section/lesson counts, estimated duration, course syllabus preview, "About the instructor" | Guest | None |
| `04-login-page.png` | `/login` | Login form | Guest | None |
| `05-register-page.png` | `/register` | Registration form | Guest | None |

### desktop/learner

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-dashboard.png` | `/dashboard` | Learner dashboard with enrolled courses, certificates, and **"Recommended for you"** personalized suggestions (match-reason chips) | demo.learner | None |
| `02-my-courses.png` | `/dashboard/courses` | My Courses list | demo.learner | None |
| `03-course-player-lessons.png` | `/dashboard/courses/19` (Lessons tab) | Lesson content (TEXT) with course outline | demo.learner | Reflects effect #2 |
| `04-course-player-completed.png` | `/dashboard/courses/19` | 100% complete state with "Issue certificate" panel | demo.learner | Reflects effect #1 |
| `05-progress.png` | `/dashboard/progress` | Progress page | demo.learner | None |
| `06-certificates-list.png` | `/dashboard/certificates` | Certificates list, 2 issued certificates, each with **"Download PDF"** button | demo.learner | Reflects effects #1, #4 |
| `07-certificate-view.png` | `/dashboard/certificates/1` | Full certificate view page with **"Download PDF"** and **"Print certificate"** buttons | demo.learner | Reflects effect #1 |
| `08-live-sessions.png` | `/dashboard/live-sessions` | Upcoming live session with Join action | demo.learner | None (pre-existing real session) |
| `09-saved-courses.png` | `/dashboard/saved-courses` | Saved courses list, 2 saved courses | demo.learner | Reflects effects #5, #8 |
| `10-settings.png` | `/dashboard/settings` | Settings — My profile section | demo.learner | None |
| `11-catalog-wishlist-controls.png` | `/courses` | Catalog cards as a logged-in learner — one card "Saved" (filled/pressed bookmark), others showing outline "Save" | demo.learner | Reflects effects #5, #8 |
| `12-onboarding-already-completed.png` | `/onboarding` | "You're all set" state for an already-onboarded account | demo.learner | None |
| `13-onboarding-step1-goal.png` | `/onboarding` | Step 1 of 4 — learning goal | report.demo.learner | New account registered for this capture (effect #6) |
| `14-onboarding-step2-pace.png` | `/onboarding` | Step 2 of 4 — preferred level / weekly goal | report.demo.learner | None |
| `15-onboarding-step3-categories.png` | `/onboarding` | Step 3 of 4 — preferred categories | report.demo.learner | None |
| `16-onboarding-step4-review.png` | `/onboarding` | Step 4 of 4 — review and finish | report.demo.learner | None |
| `17-quiz-result-passed.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz result: 100%, Passed, per-question feedback | demo.learner | Reflects effect #4 |
| `18-quiz-not-started.png` | `/dashboard/courses/1` (Quizzes tab) | Quiz tab, not-started state | demo.learner | Reflects effect #9 |
| `19-quiz-in-progress.png` | `/dashboard/courses/1` (Quizzes tab) | Quiz attempt in progress, one answer selected, Submit disabled until all answered | demo.learner | None |
| `20-quiz-result-not-passed.png` | `/dashboard/courses/1` (Quizzes tab) | Quiz result: 50%, **Not passed**, per-question correct/incorrect feedback | demo.learner | Reflects effect #10 |
| `21-certificate-blocked-quiz-required.png` | `/dashboard/courses/1` | 100% lessons complete, but certificate issuance blocked with alert "Pass all published quizzes before generating a certificate" | demo.learner | Reflects effect #10 |

### desktop/instructor

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-courses-list.png` | `/instructor/courses` | Teaching courses list (Draft + Published badges) | demo.instructor | None |
| `02-create-course-modal.png` | `/instructor/courses` | Create course modal | demo.instructor | None (cancelled, no course created) |
| `03-content-builder.png` | `/instructor/courses/19/content` | Content builder, sections/lessons, all 3 lessons populated | demo.instructor | Reflects effect #2 |
| `04-lesson-edit-text.png` | `/instructor/courses/19/content` | Lesson edit form, TEXT content type, clean real lesson body ("Networking basics in the cloud") | demo.instructor | None (cancelled, not saved in this exact form state) |
| `05-lesson-edit-url.png` | `/instructor/courses/19/content` | Lesson edit form, Video (URL) content type | demo.instructor | None (cancelled, not saved in this exact form state) |
| `06-quiz-create-form.png` | `/instructor/courses/19/quizzes` | Create quiz form | demo.instructor | Reflects effect #3 (in progress) |
| `07-quiz-question-form.png` | `/instructor/courses/19/quizzes` | Add question form | demo.instructor | Reflects effect #3 (in progress) |
| `08-quiz-management.png` | `/instructor/courses/19/quizzes` | Published quiz with 2 questions + options | demo.instructor | Reflects effect #3 |
| `09-quiz-edit-form.png` | `/instructor/courses/19/quizzes` | Edit quiz metadata form | demo.instructor | None (cancelled) |
| `10-live-sessions.png` | `/instructor/live-sessions` | Scheduled live sessions list | demo.instructor | None (pre-existing real sessions) |
| `11-schedule-live-session-form.png` | `/instructor/live-sessions` | Schedule live session modal | demo.instructor | None (cancelled, no session created) |
| `12-settings-instructor-profile.png` | `/dashboard/settings?section=instructor` | Instructor profile section in Settings | demo.instructor | None |
| `13-quiz-builder-published.png` | `/instructor/courses/1/quizzes` | Published quiz on course 1 ("Spring Boot REST API Knowledge Check") with 2 questions, options, and marked-correct answers expanded | demo.instructor | Reflects effect #9 |

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
| `03-course-detail.png` | `/courses/19` | Public course detail, mobile layout — **enriched**: syllabus preview, instructor info | Guest | None |
| `04-login-page.png` | `/login` | Login form | Guest | None |
| `05-register-page.png` | `/register` | Registration form | Guest | None |
| `06-mobile-nav-menu.png` | `/` | Mobile hamburger nav menu (open) | Guest | None |

### mobile/learner

| Filename | Route | Description | Login | Side effects |
|---|---|---|---|---|
| `01-dashboard.png` | `/dashboard` | Learner dashboard, mobile layout, including **"Recommended for you"** suggestions | demo.learner | None |
| `02-nav-drawer.png` | `/dashboard` | Mobile learner nav drawer (open) | demo.learner | None |
| `03-course-player-lessons.png` | `/dashboard/courses/19` (Lessons tab) | Lesson content, mobile layout with collapsible outline | demo.learner | Reflects effects #1, #2 |
| `04-course-player-quiz-tab.png` | `/dashboard/courses/19` (Quizzes tab) | Quiz result (Passed, attempt history) on mobile | demo.learner | Reflects effects #3, #4 |
| `05-progress.png` | `/dashboard/progress` | Progress page | demo.learner | None |
| `06-certificates-list.png` | `/dashboard/certificates` | Certificates list, mobile layout, with **"Download PDF"** buttons | demo.learner | Reflects effects #1, #4 |
| `07-live-sessions.png` | `/dashboard/live-sessions` | Live sessions list | demo.learner | None |
| `08-saved-courses.png` | `/dashboard/saved-courses` | Saved courses list, 2 saved courses, mobile layout | demo.learner | Reflects effects #5, #8 |
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
- desktop/learner: 21
- desktop/instructor: 13
- desktop/admin: 2
- mobile/shared: 6
- mobile/learner: 10
- mobile/instructor: 5
- mobile/admin: 1
- **Total: 63 screenshots**
