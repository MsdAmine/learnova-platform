# Learnova — Report Package

This is the entry point to the PFA (4th-year project) report and demo
documentation for Learnova. It indexes the documents in `docs/report/` and
states, in one place, what is and is not currently implemented — so the rest
of the package can stay focused on its own topic without repeating this
context.

Learnova is a structured online learning platform connecting corporate
learners with expert-led courses, built as a Spring Boot modular monolith
backend with a React + TypeScript frontend, and centered on a dual-profile
model where one account can act as both learner and instructor (see
`PRODUCT.md` and `project-overview.md` for the full framing).

## Recommended Reading Order

1. **[project-overview.md](./project-overview.md)** — start here for the big picture
2. **[class-diagram.md](./class-diagram.md)** — the persistent domain model
3. **[sequence-diagrams.md](./sequence-diagrams.md)** — call sequences for the six flagship flows
4. **[core-workflows.md](./core-workflows.md)** — step-by-step walkthroughs of all ten implemented workflows
5. **[api-summary.md](./api-summary.md)** — the full REST surface, grouped by module
6. **[testing-summary.md](./testing-summary.md)** — backend test coverage and frontend verification style
7. **[limitations.md](./limitations.md)** — known gaps, read last so they land with full context

## File Index

| File | Purpose |
|---|---|
| `project-overview.md` | Objective, target users, modules, implemented workflows, limitations summary, architecture summary |
| `class-diagram.md` | Mermaid UML class diagrams of the JPA domain model (main model + quiz/assessment model) and enum reference |
| `sequence-diagrams.md` | Mermaid UML sequence diagrams for instructor approval, enrollment/lesson progress, quiz attempt/scoring, quiz retake/attempt history, certificate issuance, and profile switching |
| `core-workflows.md` | Actor/goal/steps/endpoints/routes/result for all ten implemented end-to-end workflows |
| `api-summary.md` | REST endpoint reference grouped by module (method, path, access level, purpose), sourced from controllers |
| `testing-summary.md` | Backend test suite breakdown by category, frontend verification style, untested/placeholder areas |
| `limitations.md` | Consolidated list of known gaps and out-of-scope features |
| `README.md` | This index |

## What Each Document Is For

- **project-overview.md** is the document to hand someone who has never seen
  the project — it answers "what is this and who is it for."
- **class-diagram.md** answers "how is the data modeled" — entities,
  relationships, and enums, taken directly from the JPA entity classes.
- **sequence-diagrams.md** answers "how do the pieces actually talk to each
  other" for the six flows most relevant to a live demo: instructor
  approval, enrollment + lesson progress, quiz scoring, quiz retake/attempt
  history, certificate issuance, and profile switching.
- **core-workflows.md** is the demo script — each workflow lists the exact
  endpoints and frontend routes involved, suitable for narrating a live
  walkthrough.
- **api-summary.md** is the endpoint reference — useful when cross-checking
  a claim in any other document against the actual controller surface, or
  when answering "does endpoint X exist."
- **testing-summary.md** is the evidence document — what is verified by
  automated tests versus manual QA, and where coverage does not yet exist.
- **limitations.md** is the honesty document — what not to claim during the
  demo or in the written report, and why.

## Current Implementation Status Summary

**Implemented end-to-end** (backend endpoint + wired frontend screen):
learner registration/login, instructor application and admin approval,
instructor course/content/quiz authoring, learner enrollment, lesson study
and progress tracking, learner quiz-taking with automatic scoring plus
retake and full attempt history, wishlist / saved courses, profile
self-editing for both learner and instructor profiles, learner
certificate issuance + viewing (manually triggered from the course player
once a course reaches 100% progress), and approved-instructor profile
switching (`POST /api/v1/profile/switch`, called from `DashboardLayout`'s
switch card, `InstructorLayout`'s "back to learner" action, and
`SettingsPage`'s "Go to teaching area" action — see `core-workflows.md` §10).

**Not implemented / explicitly out of scope for this codebase:**
- **Live sessions** — no backend exists; the frontend page is a
  placeholder/mock only.
- **Lesson video/rich content** — the course player's lesson content area is
  a placeholder panel; no video or rich-body rendering exists.
- **File upload** — `thumbnailUrl` and `profileImageUrl` accept plain URL
  strings only; there is no upload pipeline.
- **Quiz attempt-history pagination** — the attempt-history endpoint returns
  the full, unbounded list of a learner's attempts for a quiz.
- **Ordering / reordering** — sections, lessons, questions, and answer
  options are always appended; no drag-reorder or explicit order field
  exists.

See `limitations.md` for the complete, categorized list.

## Diagram Inventory

| Diagram | File | Type |
|---|---|---|
| Main domain model (User, profiles, course structure, enrollment, progress, wishlist) | `class-diagram.md` | Mermaid `classDiagram` |
| Quiz and assessment model (Quiz, Question, AnswerOption) | `class-diagram.md` | Mermaid `classDiagram` |
| Instructor application and approval | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |
| Learner enrollment and lesson progress | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |
| Learner quiz attempt and scoring | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |
| Learner quiz retake and attempt history | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |
| Learner certificate issuance | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |
| Approved-instructor profile switching | `sequence-diagrams.md` | Mermaid `sequenceDiagram` |

All diagrams render directly from standard Mermaid syntax — no external
tooling or generated image assets are required.

## Screenshot Evidence

Manual browser-QA screenshots captured from a running dev instance, stored
under `docs/report/assets/screenshots/`. These are demo/report evidence of
what the running application looks like — they are not automated tests and
do not by themselves prove backend correctness (that evidence is the test
suite, see `testing-summary.md`).

| Screenshot | Demonstrates |
| --- | --- |
| `assets/screenshots/01-public-catalog.png` | Public catalog and course discovery |
| `assets/screenshots/02-learner-dashboard.png` | Learner dashboard overview |
| `assets/screenshots/03-course-player-lessons.png` | Course player — lesson study and progress |
| `assets/screenshots/04-course-player-quiz-result.png` | Learner quiz-taking and scored result |
| `assets/screenshots/05-instructor-content-builder.png` | Instructor content authoring (sections/lessons/quiz builder) |
| `assets/screenshots/06-admin-instructor-approvals.png` | Admin instructor-approval review |
| `assets/screenshots/mobile-course-player.png` | Course player on a mobile viewport (responsive layout) |
| `assets/screenshots/mobile-settings.png` | Settings/profile-editing page on a mobile viewport (responsive layout) |

## Testing Evidence Summary

The backend test suite (`backend/src/test/java`) contains 27 test classes
covering auth/security, course lifecycle, enrollment, lesson progress,
instructor content authoring, instructor quiz read/authoring, learner quiz
attempts, certificates, and profile editing. Exact current pass/fail counts are not stated
here — run `./mvnw test` from `backend/` for the live number. The frontend
now has a minimal automated test harness (Vitest + React Testing Library +
jsdom): 4 test files, 17 tests, run via `npm run test` —
`frontend/src/hooks/useProfileSwitch.test.tsx`,
`frontend/src/features/dashboard/pages/LearnerDashboard.test.tsx`,
`frontend/src/api/learnerQuizzes.test.ts`, and
`frontend/src/features/dashboard/components/courseQuiz/QuizCard.test.tsx`
(the extracted `CoursePlayer` quiz history UI). Beyond that, frontend
verification is lint (`npm run lint`), build (`npm run build`), and manual
browser QA. Full detail in `testing-summary.md`.

## Known Limitations Note

Live sessions have no backend in this codebase and must not be presented as
implemented. Certificates are implemented but issuance is manual (triggered
from the course player), not automatic, and offers only browser print —
no PDF generation, sharing, QR code, or revocation. Quiz attempt history and
retake are implemented but the attempt-history endpoint has no pagination.
Lesson video/rich content, file upload, and section/lesson/question/option
ordering do not exist either. Profile switching is implemented end-to-end
across all UI entry points (dashboard switch card, instructor layout
back-to-learner action, and the Settings page's "Go to teaching area"
action) — no remaining navigation-only caveat. Full categorized list in
`limitations.md`.

## Suggested Next Report Assets to Add Later

- A short screen recording of the three flagship flows (instructor approval,
  enrollment + lesson progress, quiz attempt) to complement the static
  screenshots in `assets/screenshots/`.
- A short slide deck summarizing `project-overview.md` for the oral defense.
- An actual `./mvnw test` run transcript captured at submission time, to
  pin down the exact test count referenced loosely in `testing-summary.md`.
- A risk/roadmap note distinguishing "deferred by design" gaps (e.g., quiz
  attempt-history pagination) from "blocked on another developer" gaps
  (e.g., certificates), to help the jury separate scope decisions from
  dependencies.
