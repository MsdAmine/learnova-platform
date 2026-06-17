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
3. **[sequence-diagrams.md](./sequence-diagrams.md)** — call sequences for the three flagship flows
4. **[core-workflows.md](./core-workflows.md)** — step-by-step walkthroughs of all eight implemented workflows
5. **[api-summary.md](./api-summary.md)** — the full REST surface, grouped by module
6. **[testing-summary.md](./testing-summary.md)** — backend test coverage and frontend verification style
7. **[limitations.md](./limitations.md)** — known gaps, read last so they land with full context

## File Index

| File | Purpose |
|---|---|
| `project-overview.md` | Objective, target users, modules, implemented workflows, limitations summary, architecture summary |
| `class-diagram.md` | Mermaid UML class diagrams of the JPA domain model (main model + quiz/assessment model) and enum reference |
| `sequence-diagrams.md` | Mermaid UML sequence diagrams for instructor approval, enrollment/lesson progress, and quiz attempt/scoring |
| `core-workflows.md` | Actor/goal/steps/endpoints/routes/result for all eight implemented end-to-end workflows |
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
  other" for the three flows most relevant to a live demo: instructor
  approval, enrollment + lesson progress, and quiz scoring.
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
and progress tracking, learner quiz-taking with automatic scoring, wishlist
/ saved courses, and profile self-editing for both learner and instructor
profiles.

**Not implemented / explicitly out of scope for this codebase:**
- **Certificates** — owned by another developer; no certificate backend
  exists here. Do not present certificate issuance as implemented.
- **Live sessions** — no backend exists; the frontend page is a
  placeholder/mock only.
- **Lesson video/rich content** — the course player's lesson content area is
  a placeholder panel; no video or rich-body rendering exists.
- **File upload** — `thumbnailUrl` and `profileImageUrl` accept plain URL
  strings only; there is no upload pipeline.
- **Quiz attempt history** — learners can attempt and resume one
  in-progress attempt at a time, but there is no list/review of past
  attempts and no dedicated retake flow.
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

All diagrams render directly from standard Mermaid syntax — no external
tooling or generated image assets are required.

## Testing Evidence Summary

The backend test suite (`backend/src/test/java`) contains 27 test classes
covering auth/security, course lifecycle, enrollment, lesson progress,
instructor content authoring, instructor quiz read/authoring, learner quiz
attempts, and profile editing. Exact current pass/fail counts are not stated
here — run `./mvnw test` from `backend/` for the live number. The frontend
has no automated test suite yet; verification is lint (`npm run lint`),
build (`npm run build`), and manual browser QA. Full detail in
`testing-summary.md`.

## Known Limitations Note

Certificates and live sessions have no backend in this codebase and must not
be presented as implemented. Lesson video/rich content, file upload, quiz
attempt history, and section/lesson/question/option ordering do not exist
either. Full categorized list in `limitations.md`.

## Suggested Next Report Assets to Add Later

- Annotated screenshots or a short screen recording of the three flagship
  flows (instructor approval, enrollment + lesson progress, quiz attempt),
  once the task scope allows visual assets.
- A short slide deck summarizing `project-overview.md` for the oral defense.
- An actual `./mvnw test` run transcript captured at submission time, to
  pin down the exact test count referenced loosely in `testing-summary.md`.
- A risk/roadmap note distinguishing "deferred by design" gaps (e.g., no
  profile-switcher UI) from "blocked on another developer" gaps (e.g.,
  certificates), to help the jury separate scope decisions from dependencies.
