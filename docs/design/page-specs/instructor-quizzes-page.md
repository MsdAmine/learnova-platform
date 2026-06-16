# Instructor Quiz Management Page, UI & Interaction Specification

> No-implementation spec. This document defines the instructor-facing **quiz management** surface: the workspace where an approved instructor creates and manages the quizzes attached to one of their own courses, authors questions inside each quiz, and manages the answer options inside each question. It is a documentation and design task only. Do not implement the React page, the API client, or any backend endpoint from this document without a follow-up task.
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use across `InstructorCoursesPage.tsx`, `InstructorCourseContentPage.tsx`, `InstructorLayout.tsx`, `Button.tsx`, `Badge.tsx`, `Input.tsx`, and `StatePanel.tsx`. Where a role has no defined token, it is flagged as a design decision, not invented.

---

## 0. Scope & Assumptions

This is the third instructor-facing product surface in Learnova, a sibling of the course list (`/instructor/courses`) and the content builder (`/instructor/courses/:courseId/content`). Where the content builder manages the **sections and lessons** a learner studies, this page manages the **assessments** attached to a course: quizzes, the questions inside them, and the answer options inside each question.

**This is product UI, not marketing UI.** It is not a public catalog, not a marketplace, and not an analytics dashboard. It should feel like a calm assessment-authoring workspace: structured editing, safe content actions, and clarity above all, consistent with the content builder.

**The current backend reality (verified, see §1):** quiz authoring is **write-complete but read-absent**.

- The instructor can already **create, update, publish, and archive** quizzes; **add, update, and delete** questions; and **add, update, and delete** answer options, all through real, secured mutation endpoints in `InstructorQuizController`.
- There is **no** `GET` endpoint to list a course's quizzes and **no** `GET` endpoint to fetch a single quiz with its questions and options. The frontend therefore has nothing to rehydrate from on load.

Because of that gap, **this page cannot be built against the current backend.** Two read endpoints (§1, §13) must be added before the frontend is implementable. The rest of the page (mutations, validation, status transitions) maps onto endpoints that already exist.

**In scope for v1 (once the read endpoints exist):**

- Loading the list of quizzes for one owned course.
- Loading one quiz's full tree (questions and answer options) for editing.
- Creating a quiz (`title`, `description?`, `passingScore`, `sectionId?`).
- Editing a quiz (full replace of those same fields).
- Publishing a quiz, surfacing the backend's publish-validation failures inline.
- Archiving a quiz.
- Adding, editing, and deleting a question (`content`, `points`, `type`).
- Adding, editing, marking-correct, and deleting an answer option (`optionText`, `isCorrect`).
- Loading, empty, and error states, plus calm handling of the archived-quiz and publish-validation responses.

**Out of scope for v1 (do not build, do not imply in the UI):**

- **Any learner quiz-taking flow**: no quiz attempts, no answer submission, no scoring, no pass/fail result, no certificate. This page is **authoring only**. The learner side does not exist on the backend and is not designed here.
- **Fake assessment analytics**: no attempt counts, no average scores, no learner results, no completion rates, no time-to-complete, no duration. None of these fields exist on any DTO.
- **Question or option reordering** (drag and drop, move up/down). No ordering field exists on the entities or DTOs (§2, §14).
- **Unpublish** (PUBLISHED → DRAFT). There is no such endpoint (§8, §14).
- **New question types** beyond the two the enum defines (`MULTIPLE_CHOICE`, `TRUE_FALSE`).
- **New database model.** This spec adds no entities, no columns. It specifies two read endpoints over the existing model only.

**Access assumption.** This page is **instructor-only** and must sit behind `InstructorRoute`. The guard already exists (`frontend/src/components/common/InstructorRoute.tsx`) and checks `isAuthenticated` plus `user.availableProfiles.includes('INSTRUCTOR')`, redirecting unauthenticated users to `/login` and authenticated-but-not-instructor users to `/unauthorized`. The backend `availableProfiles` remains the single source of truth for instructor access. Do not infer instructor access from `activeProfile` alone or from stale localStorage.

**Ownership assumption.** Every quiz mutation endpoint runs `checkTeacherOwnership` (verified in `QuizService`): it resolves the caller's `InstructorProfile` and rejects with **403** if the profile is missing or if the targeted course is owned by another instructor. The new read endpoints must enforce the same check. The page may assume that anything it can read, it owns.

---

## 1. Route & Access

### Recommended route

```
/instructor/courses/:courseId/quizzes
```

Register it as a child of the existing `/instructor` route in `frontend/src/router/index.tsx`, as a sibling of the current `courses` and `courses/:courseId/content` children. The `/instructor` parent is already wrapped in `InstructorRoute` and renders `InstructorLayout` (verified in `router/index.tsx` lines 184 to 213). A new child therefore inherits both the guard and the instructor shell with no additional wiring beyond the route entry and a lazy import.

```tsx
// Conceptual placement in src/router/index.tsx (do not implement in this task).
// Sibling of the existing { path: 'courses/:courseId/content', ... } child under '/instructor'.
{
  path: 'courses/:courseId/quizzes',
  element: (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <InstructorQuizzesPage />
    </Suspense>
  ),
}
```

The static `courses` child, the `courses/:courseId/content` child, and the new `courses/:courseId/quizzes` child resolve without conflict in React Router v7. No existing route is displaced.

### Guard

**`InstructorRoute`**, inherited from the `/instructor` parent. Do not add a second guard and do not duplicate authorization logic inside the page. The page may assume that if it renders, the viewer is an approved instructor. Redirect behavior is owned by the guard:

- Not authenticated, redirect to `/login`.
- Authenticated but `availableProfiles` does not include `'INSTRUCTOR'`, redirect to `/unauthorized`.

### Shell

**Use the existing `InstructorLayout`** (`frontend/src/features/instructor/components/InstructorLayout.tsx`). It already provides the instructor topbar (back-to-dashboard link, logo, a "Teaching" pill, notifications, and a user chip reading "{name} / Instructor"), a skip-to-content link, and a scrollable `<main id="main-content">`. Rendering this page as a child of `/instructor` places it inside that shell automatically. This spec therefore covers **only the content column**, not page chrome. Do not introduce a new layout.

### Status-code behavior the page handles locally

The backend enforces ownership on every mutation endpoint, and must do the same on the new reads. Most failures are handled by the global Axios interceptor; only a few are page-local. **Note the difference from the content builder:** `QuizService` rejects edits to an archived quiz with **400 Bad Request**, not the 409 the section/lesson endpoints use. This page must branch on 400 for that case.

| Result | Source (verified in `QuizService`) | Page behavior |
|---|---|---|
| **401 Unauthorized** | global Axios interceptor (`setupApiInterceptors`) | `logout()` + redirect to `/login`. Page does not handle. |
| **403 Forbidden** | global Axios interceptor | redirect to `/unauthorized`, no logout. Page does not handle. This covers cross-instructor access: `checkTeacherOwnership` throws 403 ("Access denied. You are not the authorized owner of this course resource") when the resource belongs to another instructor, and throws 403 ("Authenticated account does not possess an Instructor Profile") when the caller has no instructor profile. |
| **404 Not Found** | `findById(...).orElseThrow` throws 404 for an unknown `courseId`, `quizId`, `questionId`, or `optionId` ("Target course context not found", "Quiz not found", etc.) | page-local for the **course-level read** (render the course-not-found state, §12) and inline for **stale child rows** (a question or option deleted between load and action, §12). Do not retry a 404. |
| **400 Bad Request, archived** | `updateQuiz` and `addQuestionToQuiz` throw 400 ("Archived quizzes cannot be modified" / "Cannot add questions to an archived quiz") | page-local: render a calm **inline** message at the action site (§8, §11), never a page-level red banner. |
| **400 Bad Request, publish validation** | `publishQuiz` throws 400 ("Cannot publish a quiz with no questions" / "Question {id} has no answer options" / "Question {id} lacks a true isCorrect target flag") | page-local: render a calm **inline** message at the quiz's publish control (§8). |
| **400 Bad Request, section scope** | `createQuiz` / `updateQuiz` throw 400 ("Invalid scope mapping. The selected section does not belong to the targeted course") | page-local: inline form error on the section field. The UI should make this near-impossible by only offering this course's sections (§5). |
| **400 Bad Request, Bean Validation** | blank/over-length title, missing `passingScore`, out-of-range `passingScore`, blank question content, etc. | page-local: inline field error under the offending input (§5, §6, §7). |

> Note on the 403 path for cross-instructor access. Because the shared interceptor redirects 403 to `/unauthorized`, an instructor who opens another instructor's `courseId` is sent to `/unauthorized` rather than seeing an in-page message. That is the established app-wide behavior and this page must not override it. (Same constraint as the content builder spec.)

### Entry points (future wiring, noted for continuity)

This page must function when reached by direct URL. Two entry points are recommended as fast-follow wiring (§10):

- A **"Quizzes"** link on `InstructorCourseContentPage` (the natural sibling surface), pointing at `/instructor/courses/{courseId}/quizzes`.
- Optionally, a **"Quizzes"** row action on `InstructorCoursesPage`, but only if it can be added without crowding the existing action cluster (Publish / Manage content / Edit / Archive). The content-page link is the primary entry point; the list-page action is secondary.

---

## 2. Backend Contract Findings

All paths, status codes, request shapes, and error semantics below are verified against `InstructorQuizController.java`, `QuizService.java`, the quiz DTOs, and the `Quiz` / `Question` / `AnswerOption` entities and their enums. Do not assume any field or behavior not listed here.

### Existing mutation endpoints (verified, available today)

Controller base path: `/api/v1/instructor/courses`. Class-level guard: `@PreAuthorize("hasRole('INSTRUCTOR')")`. Every method additionally runs a service-level ownership check.

| Method | Path | Success | Request body | Returns |
|---|---|---|---|---|
| POST | `/{courseId}/quizzes` | **201 Created** | `QuizRequest` | `QuizResponse` (status `DRAFT`) |
| PUT | `/quizzes/{quizId}` | 200 | `QuizUpdateRequest` | `QuizResponse` |
| PATCH | `/quizzes/{quizId}/publish` | 200 | none | `QuizResponse` (status `PUBLISHED`) |
| PATCH | `/quizzes/{quizId}/archive` | 200 | none | `QuizResponse` (status `ARCHIVED`) |
| POST | `/quizzes/{quizId}/questions` | **201 Created** | `QuestionRequest` | `QuestionResponse` |
| PUT | `/questions/{questionId}` | 200 | `QuestionRequest` | `QuestionResponse` |
| DELETE | `/questions/{questionId}` | **204 No Content** | none | empty body |
| POST | `/questions/{questionId}/options` | **201 Created** | `AnswerOptionRequest` | `AnswerOptionResponse` |
| PUT | `/options/{optionId}` | 200 | `AnswerOptionRequest` | `AnswerOptionResponse` |
| DELETE | `/options/{optionId}` | **204 No Content** | none | empty body |

### Missing read endpoints (the gap)

There is **no** `GET` to list a course's quizzes and **no** `GET` to fetch a single quiz tree. `QuizRepository` already exposes `findByCourseId(Long courseId)` and `findBySectionId(Long sectionId)`, so the list query has a repository method ready; the detail tree (quiz → questions → options) can be assembled from the existing entity graph inside a `@Transactional` method. Both endpoints are specified in §13. **The frontend depends on them and cannot be built without them.**

### Request DTOs (verified constraints)

```jsonc
// QuizRequest  (POST create)
{
  "title": "Module 1 Knowledge Check",  // @NotBlank, @Size(max = 150)
  "description": "Optional overview.",   // optional, free text (TEXT column)
  "passingScore": 70,                    // @NotNull, @Min(1), @Max(100)  -> percentage
  "sectionId": 100                       // optional Long; must belong to {courseId} or 400
}

// QuizUpdateRequest  (PUT update) — identical shape to QuizRequest.
// PUT is a FULL REPLACE: title and passingScore are required on every edit submit,
// description and sectionId are nullable (sending null clears them).
{ "title": "...", "description": null, "passingScore": 80, "sectionId": null }

// QuestionRequest  (POST add / PUT update)
{
  "content": "What does useMemo return?",  // @NotBlank (TEXT column)
  "points": 1,                              // @NotNull, @Min(1)
  "type": "MULTIPLE_CHOICE"                 // @NotNull, QuestionType enum
}

// AnswerOptionRequest  (POST add / PUT update)
{
  "optionText": "A memoized value",  // @NotBlank (TEXT column)
  "isCorrect": true                  // @NotNull Boolean (must be explicit, not defaulted)
}
```

The service trims `title`, `description`, `content`, and `optionText` server-side before persisting, so leading/trailing whitespace is removed regardless of client input.

### Response DTOs (exhaustive, verified field for field)

```jsonc
// QuizResponse  (returned by create/update/publish/archive, and by the new list endpoint)
{
  "id": 42,                 // Long
  "title": "Module 1 Knowledge Check",
  "description": "Optional overview.",  // String | null
  "passingScore": 70,       // Integer (percentage 1..100)
  "status": "DRAFT",        // QuizStatus: DRAFT | PUBLISHED | ARCHIVED
  "courseId": 12,           // Long
  "sectionId": 100,         // Long | null
  "createdAt": "2026-06-16T10:15:30",  // LocalDateTime (see note below)
  "updatedAt": "2026-06-16T10:15:30"   // LocalDateTime
}

// QuestionResponse  (returned by add/update question; nested in the new detail endpoint)
{
  "id": 500,                // Long
  "content": "What does useMemo return?",
  "points": 1,              // Integer
  "type": "MULTIPLE_CHOICE",// QuestionType: MULTIPLE_CHOICE | TRUE_FALSE
  "answerOptions": [        // List<AnswerOptionResponse>, may be empty
    { "id": 9001, "optionText": "A memoized value", "isCorrect": true },
    { "id": 9002, "optionText": "A ref object",     "isCorrect": false }
  ]
}

// AnswerOptionResponse
{ "id": 9001, "optionText": "A memoized value", "isCorrect": true }  // id Long, text String, isCorrect Boolean
```

> **Timestamp note.** `QuizResponse` uses `LocalDateTime` (`@CreationTimestamp` / `@UpdateTimestamp` on the `Quiz` entity), which deviates from the project's `Instant` convention noted in CLAUDE.md. The frontend type is `string` either way; this is a backend observation, not a UI concern. The page may show a quiet "Updated ..." line if desired (§4), but timestamps are not load-bearing for any decision.

> **Fields that DO NOT exist** on these DTOs and must not be rendered or implied: any attempt count, average score, learner result, pass/fail rate, completion count, time/duration, question difficulty, option ordering index, quiz "due date", quiz weight toward a final grade, or certificate reference. `QuizResponse` also carries **no nested `questions` list** (the list endpoint returns flat quiz rows; only the detail endpoint carries the tree, §13).

### Verified service behavior that drives the UI

| Operation | Verified behavior | UI consequence |
|---|---|---|
| `createQuiz` | Validates course exists (404) and ownership (403). If `sectionId` set, the section must exist (404) and belong to the course (400). Persists as `DRAFT`. | New quizzes are always drafts; the UI never offers a "create as published" path (§5). |
| `updateQuiz` (PUT) | 404 if quiz missing, 403 ownership. **Blocks `ARCHIVED` with 400** ("Archived quizzes cannot be modified"). Full replace of title/description/passingScore/section. **Does NOT block `PUBLISHED`** — editing a published quiz is allowed by the backend. | Edit is offered for `DRAFT` and `PUBLISHED`, blocked for `ARCHIVED` (§4, §8). |
| `publishQuiz` | 404, 403. Rejects with 400 if: the quiz has **no questions**; any question has **no answer options**; any question has **no option with `isCorrect = true`**. On success sets `PUBLISHED`. **No status guard** — see §8 quirk note. | Publish errors are surfaced inline at the quiz; the page should also pre-warn from the locally known tree (§8). |
| `archiveQuiz` | 404, 403. Sets `ARCHIVED`. **No status guard** — archivable from any state. | Archive is offered for `DRAFT` and `PUBLISHED` (§8). |
| `addQuestionToQuiz` | 404, 403. **Blocks `ARCHIVED` with 400** ("Cannot add questions to an archived quiz"). | Add-question is hidden/disabled for archived quizzes (§6, §11). |
| `updateQuestion`, `deleteQuestion` | 404, 403. **No archived guard** — these succeed even on an archived quiz. | See the asymmetry note below and §11. |
| `addOptionToQuestion`, `updateAnswerOption`, `deleteAnswerOption` | 404, 403. **No archived guard** — these succeed even on an archived quiz. | See the asymmetry note below and §11. |

> **Backend asymmetry (document honestly, do not silently work around).** The archived-quiz guard is applied to `updateQuiz` and `addQuestionToQuiz` only. `updateQuestion`, `deleteQuestion`, `addOptionToQuestion`, `updateAnswerOption`, and `deleteAnswerOption` carry **no** archived check and will mutate the children of an archived quiz. The cleanest UI is to treat an archived quiz as fully read-only and **not render** child mutation controls at all (§11), so the page never depends on the inconsistent guard. Tightening the backend so all child mutations also reject on archived is flagged as an open decision (§14).

### Verified cascade behavior (drives delete copy in §6, §7)

- `Quiz` → `Question`: `@OneToMany(cascade = ALL, orphanRemoval = true)`. Deleting a quiz would delete its questions (there is no delete-quiz endpoint today; archive is the lifecycle terminal, §8).
- `Question` → `AnswerOption`: `@OneToMany(cascade = ALL, orphanRemoval = true)`. **Deleting a question deletes all of its answer options.** The delete-question confirm copy must say so (§6).
- `deleteAnswerOption` removes the option from its question's collection and deletes it; no further cascade.

### Frontend client status

There is **no** `src/api/instructorQuizzes.ts` and no quiz hook today. `src/api/instructorCourses.ts` (course CRUD) and `src/api/instructorCourseContent.ts` (section/lesson CRUD) are the closest siblings to mirror for style. The quiz client is net-new and belongs to the follow-up implementation task (§13, §15).

---

## 3. Frontend State Model

Frontend types mirror the backend DTOs exactly. No invented fields.

```ts
// src/api/instructorQuizzes.ts (net-new)
export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuizResponse {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  status: QuizStatus;
  courseId: number;
  sectionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerOptionResponse {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

export interface QuestionResponse {
  id: number;
  content: string;
  points: number;
  type: QuestionType;
  answerOptions: AnswerOptionResponse[];
}

// Detail tree returned by the new GET /quizzes/{quizId} (§13).
// Composes the existing QuizResponse fields with the question list; invents no leaf fields.
export interface QuizDetailResponse extends QuizResponse {
  questions: QuestionResponse[];
}

// Request payloads (mirror the request DTOs exactly).
export interface QuizRequestPayload {
  title: string;
  description?: string | null;
  passingScore: number;
  sectionId?: number | null;
}
export interface QuestionRequestPayload {
  content: string;
  points: number;
  type: QuestionType;
}
export interface AnswerOptionRequestPayload {
  optionText: string;
  isCorrect: boolean;
}
```

### Local UI state (page component)

| State | Type | Purpose |
|---|---|---|
| `courseId` | `number` | Parsed from the route param. Drives the list fetch and create calls. |
| `quizzes` | `QuizResponse[]` | The course's quiz list (flat rows). Source of truth for the list column. |
| `loading` | `boolean` | Initial quiz-list fetch in flight. Drives the skeleton (§9). |
| `listError` | `'none' \| 'notFound' \| 'generic'` | 404 (course not found) and 500 (generic) render different states (§9). |
| `expandedQuizId` | `number \| null` | The quiz whose question tree is open in the editor. At most one at a time. |
| `quizDetail` | `QuizDetailResponse \| null` | The loaded tree for `expandedQuizId`. Fetched lazily on expand (§4, §6). |
| `detailLoading` | `boolean` | The detail fetch for the expanded quiz is in flight. |
| `detailError` | `'none' \| 'notFound' \| 'generic'` | Per-quiz detail load failure (§9). |
| `quizFormMode` | `'closed' \| 'create' \| { edit: number }` | Whether the quiz create/edit form is open and for which quiz (§5). |
| `addingQuestion` | `boolean` | The inline add-question form on the expanded quiz is open (§6). |
| `editingQuestionId` | `number \| null` | Question currently in inline edit mode (§6). |
| `addingOptionQuestionId` | `number \| null` | Question whose inline add-option form is open (§7). |
| `editingOptionId` | `number \| null` | Option currently in inline edit mode (§7). |
| `deleteTarget` | `{ kind: 'question' \| 'option'; id: number; label: string } \| null` | Item awaiting delete confirmation (§6, §7). |
| `pendingIds` | `Set<string>` | Keys such as `"quiz:42"`, `"question:500"`, `"option:9001"` whose mutation is in flight. Drives per-control `Button loading` and disables siblings on that row. |
| `rowErrors` | `Record<string, string>` | Map from a row key to a calm inline error message: archived-400, publish-400, stale-404, and field validation (§8, §9, §11). |

Derived (not stored): `totalQuizzes = quizzes.length`, `publishedCount`, `draftCount`, `archivedCount` (§4 summary strip); per-quiz `questionCount` and per-question `optionCount` from the loaded detail tree. Recomputed on every successful mutation.

> Do not add any attempt, score, result, duration, or ordering state. None of it has a backend source in v1.

---

## 4. Layout & Structure

### Page shell

Use the canonical product page shell, identical to `InstructorCoursesPage` and `InstructorCourseContentPage`:

```html
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

No `Container` primitive (that is the marketing width primitive). No `SectionHeader`, no `Stat`, no full-bleed marketing `<section>` bands.

### Top-to-bottom structure

1. **Back link** to `/instructor/courses/:courseId/content` (the sibling builder), with a secondary link to `/instructor/courses` if desired (§5).
2. **Header**: H1 "Quizzes", one helper line (§5 of this layout / header is §5 below).
3. **Summary strip**: an inline "N quizzes · X published · Y draft" line, not `Stat` (§4 summary rules below).
4. **Builder body**: a two-column grid on desktop.
   - **Main (left):** the quiz list, and the inline quiz editor (question/option tree) for the expanded quiz (§4 expansion model, §6, §7).
   - **Side (right):** a guidance and create panel (§5, §9).
5. **Loading / empty / not-found / error** states replace the body (§9).

### Quiz editor placement: inline expansion, not a separate page

When a quiz row is expanded (`expandedQuizId`), its question-and-option tree renders **inline beneath the quiz row**, pushing the rest of the list down, the same spatial idiom as the content builder's section-then-lessons nesting. This keeps the instructor in the list context, avoids a second route, and means publish/archive (quiz-level) and question/option editing live in one view. At most one quiz is expanded at a time to keep the page calm and the DOM bounded.

### Desktop grid

```html
<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
  <!-- main: quiz list + inline expanded editor -->
  <!-- aside: create-quiz + guidance panel -->
</div>
```

`minmax(0,1fr)` on the main column prevents long quiz/question titles from forcing horizontal overflow. The side column is a fixed `320px` rail on `lg`.

### Mobile behavior

On `< lg`, the layout collapses to a single column. The side column (create + guidance) renders **above** the main list so the primary "Create quiz" action is reachable without scrolling. The guidance text may be hidden on mobile (`hidden lg:block`); the create control always renders.

### Wireframe (lg)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside InstructorLayout > main)
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to course content                      (text-body-sm, secondary)│
│                                                                        │
│ Quizzes                                       (h1 · text-title / 600)  │
│ Create and manage assessments for this course.(text-body-sm secondary) │
│                                                                        │
│ 3 quizzes · 1 published · 2 drafts            (summary strip)          │
│                                                                        │
│ grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]                          │
│ ┌───────────────────────────────────┐ ┌────────────────────────────┐  │
│ │ MAIN: quiz list                   │ │ ASIDE                      │  │
│ │ ┌───────────────────────────────┐ │ │ ┌────────────────────────┐ │  │
│ │ │ Module 1 Check   [Draft]      │ │ │ │ Create a quiz          │ │  │
│ │ │ Pass: 70% · Section: Basics   │ │ │ │ [ Open create form ]   │ │  │
│ │ │       [Edit][Publish][Archive]│ │ │ └────────────────────────┘ │  │
│ │ │  ▼ expanded editor:           │ │ │ Guidance:                  │  │
│ │ │    Q1 What does useMemo… (1pt)│ │ │ A quiz needs at least one  │  │
│ │ │      ◉ A memoized value  ✓Correct  │ │ question, each question│  │
│ │ │      ○ A ref object           │ │ │ needs options, and one     │  │
│ │ │      [Add option][Edit][Del]  │ │ │ option must be correct,    │  │
│ │ │    [Add question]             │ │ │ before you can publish.    │  │
│ │ └───────────────────────────────┘ │ │                            │  │
│ │ ┌───────────────────────────────┐ │ └────────────────────────────┘  │
│ │ │ Final Assessment [Published]  │ │                                 │
│ │ │ Pass: 80% · Course-wide       │ │                                 │
│ │ │              [Edit][Archive]  │ │                                 │
│ │ └───────────────────────────────┘ │                                 │
│ └───────────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Responsive table

| Breakpoint | Shell | Columns | Side panel placement |
|---|---|---|---|
| base (`< 1024px`) | `px-8 py-8 pb-14 max-w-container mx-auto` | single column | Create panel above the list; guidance may be hidden |
| `lg` (1024px+) | same | `lg:grid-cols-[minmax(0,1fr)_320px]`, `gap-4` | Right rail, always visible |

### Summary strip rules

A single inline line beneath the header, mirroring the list/content summary idiom. **Not** the `Stat` primitive.

- Wrapper: `text-body-sm text-text-secondary mb-8`, `flex flex-wrap items-center`.
- Count numerals use `font-semibold text-text-primary`; surrounding words stay secondary.
- Dot separator `·` in `text-border-hover`, `aria-hidden`, with horizontal margin.
- Content: total quizzes, then published count, then draft count. Archived count appended only when `> 0`. Pluralize ("1 quiz" / "2 quizzes", "1 draft" / "2 drafts").
- When the course has zero quizzes, the summary strip is not shown; the empty state (§9) carries the message.
- Counts recompute on every successful create/publish/archive; not a separate fetch.

Do not add attempt counts, average scores, completion, duration, or any learner metric to this line. None has a source.

### Vertical rhythm

- Back link `mb-4`. Header block `mb-8`. Summary strip `mb-8`. Grid uses `gap-4`.
- Quiz rows: `gap-3` between rows (`flex flex-col gap-3`).
- Inside a quiz row: `p-4`; title-to-meta `mb-1`; meta-to-actions `mb-3`. Expanded editor separated from the quiz header by a `border-t border-border-default` and `pt-3 mt-3`.
- Question rows inside the editor: `gap-2`. Option rows: `gap-1`.

---

## 5. Quiz Create / Edit Behavior

### Header

| Element | Content | Typography | Weight | Color | Spacing |
|---|---|---|---|---|---|
| Back link | "← Back to course content" to `/instructor/courses/:courseId/content` | `text-body-sm` | 500 | `text-text-secondary` hover `text-text-primary` | `mb-4`, `gap-1`, `focus-visible:outline-salem` |
| H1 | "Quizzes" | `text-title` | `font-semibold` (600) | `text-text-primary` | header block `mb-8` |
| Subtitle | "Create and manage assessments for this course." | `text-body-sm` | 400 | `text-text-secondary` | `mt-1` |

The H1 is the literal "Quizzes" (the quiz list endpoint, §13, is not required to return the course title; if the detail/list response is extended to include `courseTitle`, the subtitle may name the course, but that is optional and not assumed). The header carries **no** primary button; the single primary action is "Create quiz" in the side panel (Forest Rule, one primary per zone).

### Form presentation: side panel / inline form, not a large modal

**Use an inline form opened from the side panel, not a modal.** Justification: the quiz form has four fields (`title`, `description`, `passingScore`, `sectionId`), all simple, with one lightweight async dependency (the course's sections, only when section attachment is offered, §14). That is materially less complex than the five-field course form on `InstructorCoursesPage` that justified a modal there. An inline/side-panel form keeps the instructor in the list, matches the content builder's calmer inline idiom, and avoids focus-trap machinery. (If section attachment makes the form feel heavy in practice, a modal is an acceptable fallback, but v1 specifies inline.)

- **Create**: the side panel shows a "Create a quiz" heading and an "Open create form" affordance (or the form inline). The form fields:
  - **Title** — `Input`, required, `maxLength` ~160 with a 150 message (mirror the `maxLength={210}` / 200-message pattern from `InstructorCoursesPage`).
  - **Description (optional)** — `textarea`, free text, no max enforced by the backend (a soft client cap is acceptable, flagged as a design choice not a backend rule).
  - **Passing score (%)** — numeric `Input`, required, integer 1..100. Client-validate the range to mirror `@Min(1) @Max(100)`.
  - **Section (optional)** — a `<select>` of **this course's sections only** (see §14 open decision on whether to offer this at all in v1). Options come from `GET /api/v1/instructor/courses/{courseId}/content` (the existing content endpoint already returns sections). A "Course-wide (no section)" option maps to `sectionId: null`. Offering only this course's sections makes the 400 scope error unreachable through the UI.
  - On submit: `POST /api/v1/instructor/courses/{courseId}/quizzes`. On 201, prepend/append the returned `QuizResponse` to `quizzes`, close the form, recompute the summary strip.

- **Edit**: opened from a quiz row's "Edit" action (offered for `DRAFT` and `PUBLISHED`; **not** for `ARCHIVED`, §8). Pre-fill all four fields from the quiz. Because the backend endpoint is a **PUT full replace**, the submit always sends `title` + `passingScore` (required) and the current `description`/`sectionId` (nullable). On 200, replace the quiz in `quizzes` in place.

### Validation (mirror verified backend constraints)

- **Title**: non-blank after trim, ≤ 150 chars. Inline error copy: "Title is required." / "Title must not exceed 150 characters."
- **Passing score**: required, integer, 1..100. Inline copy: "Passing score is required." / "Passing score must be between 1 and 100."
- **Description**: optional; no backend max. If a soft client cap is added, label it clearly.
- **Section**: optional; only valid course sections are selectable, so no client error path beyond "section no longer exists" (handle as a stale-404 reload, §9).
- **Inline errors**: `text-body-sm text-error`, `role="alert"`, below the field. A 400 from the backend maps to the same field-level message; never a page-level banner for a field failure.

### After a successful quiz mutation

- Update `quizzes` in place from the response (do not refetch the whole list).
- Clear the relevant `pendingIds` and `rowErrors` entries.
- Use the `Button loading` prop on the submit button while in flight; disable sibling controls on that row via `pendingIds`.

---

## 6. Question Management Behavior

Questions live inside the **expanded quiz editor** (§4). Expanding a quiz lazily fetches its detail tree via the new `GET /quizzes/{quizId}` (§13) into `quizDetail`; while that is in flight, show a small inline skeleton inside the expanded region (§9).

### Question row

Each question renders as a row inside the expanded quiz:

- **Content**: `text-body-sm text-text-primary`, `line-clamp-2`. (In edit mode, replaced by an inline form.)
- **Meta**: a quiet `text-caption text-text-muted` line: points and type, for example "1 point · Multiple choice" / "2 points · True / false". Type is rendered as readable text, never an icon alone.
- **Actions** (right-aligned, ghost weight):
  - **Add option**: `Button variant="secondary" size="sm"` — opens the inline add-option form (§7).
  - **Edit question**: `Button variant="ghost" size="sm"` — inline edit mode.
  - **Delete question**: `Button variant="ghost" size="sm"` — opens the delete confirm step.
- Below the question: its **answer option list** (§7).

For an **archived** quiz, the question rows render **read-only**: no Add option / Edit / Delete controls, and no Add question control (§11). This sidesteps the inconsistent backend guard (§2).

### Add question (inline)

- Trigger: an "Add question" `Button variant="secondary" size="sm"` at the end of the question list (hidden for archived quizzes, where `addQuestionToQuiz` returns 400).
- Form fields (mirror `QuestionRequest`):
  - **Content** — `textarea`/`Input`, required (`@NotBlank`).
  - **Points** — numeric `Input`, required, integer ≥ 1 (`@Min(1)`). Default suggestion: 1.
  - **Type** — a `<select>` with exactly the two enum values: "Multiple choice" (`MULTIPLE_CHOICE`) and "True / false" (`TRUE_FALSE`). Do not offer any other type.
- On submit: `POST /api/v1/instructor/courses/quizzes/{quizId}/questions`. On 201, append the returned `QuestionResponse` (empty `answerOptions`) to `quizDetail.questions`, keep the form open with focus on the content input for rapid entry, recompute the question count.
- On 400 archived (only reachable if the quiz was archived in another tab between load and submit): inline message "This quiz is archived and can no longer be edited." and reconcile by reloading the quiz row.

### Question type behavior

The enum is exactly `MULTIPLE_CHOICE` and `TRUE_FALSE` (verified). Both are authored the same way at the data layer: a question owns a list of `AnswerOption` rows, each with `optionText` and `isCorrect`. There is **no** dedicated true/false answer model and **no** free-text/numeric answer model.

- For **`MULTIPLE_CHOICE`**: the instructor adds two or more options and marks at least one correct.
- For **`TRUE_FALSE`**: the data model still requires explicit `AnswerOption` rows. The UI should guide the instructor to create exactly two options ("True" and "False") and mark one correct. The backend does **not** auto-create these and does **not** enforce "exactly two" or "exactly one correct" for `TRUE_FALSE` beyond the generic publish rule (at least one correct option exists). v1 guidance copy should state this; stricter per-type validation is an open decision (§14).

> **Multiple correct options.** `publishQuiz` only requires that **at least one** option is correct; it does not forbid several options being correct. So the data model permits multi-correct questions. v1 does **not** add a "single correct only" constraint and does not need radio-button exclusivity; whether to enforce single-correct for `MULTIPLE_CHOICE` is an open decision (§14). See §7 for the correct-marking control.

### Edit question (inline)

- Trigger: "Edit question" on the row. Replace the content/meta with an inline form pre-filled with `content`, `points`, `type` (same fields as add). One question in edit mode at a time (`editingQuestionId`).
- On submit: `PUT /api/v1/instructor/courses/questions/{questionId}` (full replace of the three fields). On 200, replace the question in place, exit edit mode, return focus to the row's "Edit question" button.

### Delete question (lightweight inline confirm)

- Trigger: "Delete question". Replace the action cluster with an inline confirm, the same pattern shipped in `InstructorCourseContentPage`:
  - Prompt: **"Delete this question and its options?"** (`text-caption text-text-secondary`). The copy names the cascade because `Question → AnswerOption` is `orphanRemoval = true` (verified, §2): deleting the question deletes all its options.
  - Cancel: `Button variant="ghost" size="sm"`.
  - Confirm: `Button variant="destructive" size="sm"` labeled "Delete question", `aria-label="Confirm delete question {content excerpt}"`.
- On confirm: `DELETE /api/v1/instructor/courses/questions/{questionId}`. On 204, remove the question (and its nested options) from `quizDetail.questions`, recompute counts, return focus to a stable element (next question or the "Add question" button).
- No modal, no typed confirmation in v1. There is no restore path; the confirm step is the safety mechanism.

---

## 7. Answer Option Management Behavior

Options live inside their question, rendered as a list beneath the question content.

### Option row

- **Correct indicator (text, not color alone)**: each option shows its correct/incorrect state as **visible text plus an icon**, never color alone (DESIGN.md: never communicate by color alone; §13). For example a correct option shows a check glyph and the word **"Correct"** in `text-success`-adjacent treatment, while an incorrect option shows nothing or a muted "Not correct". The textual label is the source of truth for assistive tech.
- **Option text**: `text-body-sm text-text-primary`, `line-clamp-2`. (In edit mode, replaced by an inline form.)
- **Actions** (right-aligned, ghost weight): **Edit option**, **Delete option**. Plus a **"Mark correct" / "Marked correct"** toggle (see below). Hidden for archived quizzes (§11).

### Add option (inline)

- Trigger: "Add option" on the question row. Inline form at the end of that question's option list:
  - **Option text** — `Input`, required (`@NotBlank`).
  - **Correct** — an explicit control for `isCorrect` (a checkbox or a labeled toggle). The backend requires `isCorrect` to be sent explicitly (`@NotNull Boolean`), so the control must always resolve to `true` or `false`, defaulting to `false` (unchecked) with a visible label "Mark as correct answer".
- On submit: `POST /api/v1/instructor/courses/questions/{questionId}/options`. On 201, append the returned `AnswerOptionResponse` to the question's `answerOptions`, keep the form open with focus for rapid entry, recompute the option count.

### Edit option (inline)

- Trigger: "Edit option". Inline form pre-filled with `optionText` and `isCorrect`. One option in edit mode at a time (`editingOptionId`).
- On submit: `PUT /api/v1/instructor/courses/options/{optionId}` (full replace of `optionText` + `isCorrect`). On 200, replace the option in place.

### Marking an option correct

Because marking correct is just `isCorrect` on the option, the quickest affordance is a dedicated toggle on the option row that sends a `PUT` with the same `optionText` and the flipped `isCorrect`. v1 does **not** enforce single-correct exclusivity (the backend allows multiple correct, §6), so the toggle is independent per option, not a radio group. If single-correct is later chosen for `MULTIPLE_CHOICE` (§14), this becomes a radio-style control that clears the others; that is a deliberate future change, not v1.

### Delete option (lightweight inline confirm)

- Trigger: "Delete option". Inline confirm:
  - Prompt: **"Delete this option?"** (`text-caption text-text-secondary`).
  - Cancel (ghost) + Confirm (`destructive`, labeled "Delete option", `aria-label="Confirm delete option {text excerpt}"`).
- On confirm: `DELETE /api/v1/instructor/courses/options/{optionId}`. On 204, remove the option from the question's `answerOptions`, recompute the option count.

### Publish-readiness guidance (client-side mirror, not enforcement)

To prevent dead-end publish clicks, the editor should **surface, but not enforce**, the publish rules from the locally loaded tree (the backend remains the authority, §8):

- A question with **no options** shows a quiet inline note: "Add at least one option, and mark one correct, before publishing."
- A question with options but **none marked correct** shows: "Mark one option as the correct answer before publishing."

This is advisory copy in `text-caption text-text-muted`, not a blocking error and not a page-level banner. The real gate is the backend's 400 on publish (§8).

---

## 8. Publish & Archive Behavior

Both are quiz-level actions on the quiz row (not inside the question editor).

### Publish

- Offered for `DRAFT` quizzes (and, per the backend's missing status guard, technically callable on others — see the quirk note; v1 only renders Publish on `DRAFT`).
- Control: `Button variant="secondary" size="sm"` labeled "Publish", `aria-label="Publish quiz {title}"`.
- On click: `PATCH /api/v1/instructor/courses/quizzes/{quizId}/publish`.
- **Backend validation must surface inline** (verified failure modes, §2):
  - "Cannot publish a quiz with no questions" → inline: **"Add at least one question before publishing this quiz."**
  - "Question {id} has no answer options" → inline: **"Every question needs at least one answer option before you can publish."**
  - "Question {id} lacks a true isCorrect target flag" → inline: **"Every question needs one option marked correct before you can publish."**
- The raw server message references a question **id**, which is not meaningful to the instructor. **Do not surface the raw message.** Map each known failure to the friendly copy above. Optionally, since the page holds the loaded tree, it can scroll to / highlight the first offending question (best-effort enhancement, not required).
- On 200, replace the quiz's `status` with `PUBLISHED` in place and update the summary strip. The quiz remains editable (the backend allows editing published quizzes, §2), so its "Edit" action stays available; "Publish" is replaced by nothing (already published), "Archive" remains.

### Archive

- Offered for `DRAFT` and `PUBLISHED` quizzes.
- Control: `Button variant="ghost" size="sm"` labeled "Archive", opening a lightweight inline confirm (consistent with the course-archive pattern on `InstructorCoursesPage`): prompt "Archive this quiz?", Cancel (ghost) + Confirm (`secondary` or `destructive`, `aria-label="Confirm archive quiz {title}"`).
- On confirm: `PATCH /api/v1/instructor/courses/quizzes/{quizId}/archive`. On 200, set `status` to `ARCHIVED` in place. The quiz becomes **read-only** in the UI (§11): its child editor renders without mutation controls, and the row shows only the status badge (no Edit / Publish / Archive).

### No unpublish

There is **no** PUBLISHED → DRAFT endpoint. Do not render an "Unpublish" or "Move to draft" action. The lifecycle is `DRAFT → PUBLISHED → ARCHIVED` (with `DRAFT → ARCHIVED` also allowed). Archive is the only exit from published.

> **Backend quirk (document, do not exploit).** `publishQuiz` and `archiveQuiz` carry **no status guard**, so the backend would, for example, accept a publish call on an already-archived quiz (re-activating it) because `archiveQuiz` only sets the status and `publishQuiz` only checks the question/option rules. v1 avoids relying on this by only rendering Publish on `DRAFT` and treating `ARCHIVED` as terminal/read-only in the UI. Adding explicit status guards on the backend is an open decision (§14).

---

## 9. Loading, Empty, and Error States

All states render inside the page shell. The header (back link + "Quizzes" H1) stays stable across states.

### Loading (quiz list)

Skeleton blocks (no spinner), reusing the `Bone` idiom from `InstructorCoursesPage`:

- Header title + subtitle bones, a short summary bone, then two or three quiz-row skeletons in the main column (each `rounded-lg border border-border-default bg-surface p-4` with a title bone, a meta bone, and an action-row bone), and a create-panel skeleton in the side column.
- Wrapper `aria-hidden="true"`. No page-level spinner.

### Loading (quiz detail, on expand)

When a quiz is expanded, show a small inline skeleton **inside** the expanded region (one or two question-row bones) while `GET /quizzes/{quizId}` resolves. Do not block the whole list.

### Empty (200, zero quizzes)

The course exists and is owned but has no quizzes. Use a calm `StatePanel`-idiom panel spanning the main column, with the create panel still present in the side column:

- Title: **"No quizzes yet"**.
- Body: **"Create a quiz to assess learners after they study this course."**
- Action: a **"Create quiz"** affordance (one primary, Forest Rule), pointing at / opening the side-panel create form.

### Course not found (404)

For a true 404 on the list fetch (unknown `courseId`), render a `StatePanel` with no retry:

- Title: **"Course not found"**.
- Body: **"This course does not exist, or you do not have access to it."**
- Quiet Salem text-link back to **`/instructor/courses`**.

Cross-instructor access (403) does not reach this state; the global interceptor redirects it to `/unauthorized` (§1).

### Generic error (any non-401/403/404 list failure)

`StatePanel` with `onRetry`:

- Title/body: **"We could not load quizzes."**
- Action: **"Try again"** (re-runs the list fetch).

### Per-quiz detail error

If expanding a quiz fails generically, render an inline error inside the expanded region with a small "Try again" affordance scoped to that quiz; a 404 there means the quiz was deleted/archived elsewhere, so reconcile by reloading the list.

### Mutation errors (inline, never a page-level red banner)

- **400 archived** (quiz edit / add question): inline "This quiz is archived and can no longer be edited." at the action site (§11).
- **400 publish validation**: inline friendly copy at the publish control (§8).
- **400 field validation**: inline field error under the offending input (§5, §6, §7).
- **404 on a stale quiz / question / option** (deleted between load and action): inline "This item is no longer available.", remove the stale row or reload the affected scope.
- **401 / 403**: not handled here. The shared Axios interceptor owns both. Do not duplicate that logic.

---

## 10. Navigation & Entry Points

- **Route**: `/instructor/courses/:courseId/quizzes`, child of `/instructor`, guarded by the inherited `InstructorRoute` (§1).
- **Primary entry point**: add a **"Quizzes"** link on `InstructorCourseContentPage`, near its header or back-link region, pointing at `/instructor/courses/{courseId}/quizzes`. This is the natural sibling navigation (content ↔ assessments for the same course). Wiring it is its own fast-follow task, not built here.
- **Secondary entry point (optional)**: a **"Quizzes"** ghost action on each `InstructorCoursesPage` row, beside "Manage content". Only add it if it does not crowd the existing cluster (Publish / Manage content / Edit / Archive); the row is already dense. Prefer the content-page link as the canonical path.
- **Do not** add this page to the learner `DashboardLayout` sidebar (it is instructor-only) or to the admin navigation. There is no learner-facing quiz surface in this scope.
- The page must function when reached by **direct URL** (someone may bookmark it), independent of whether the entry-point links exist yet.

---

## 11. Archived (Read-Only) Behavior

The backend rejects `updateQuiz` and `addQuestionToQuiz` on an archived quiz with **400** ("Archived quizzes cannot be modified" / "Cannot add questions to an archived quiz"), but, as noted in §2, does **not** guard the question-update/delete or option mutations. Rather than depend on that inconsistent guard, the UI treats an archived quiz as **fully read-only**:

- The quiz row shows its title, meta, and an **`ARCHIVED` status badge**, and **no** Edit / Publish / Archive actions.
- The quiz is still **expandable** so the instructor can read its questions and options, but the expanded editor renders **without** any Add question / Edit / Delete / Add option / Mark correct / Edit option / Delete option controls.
- The read-only state is communicated by **visible text**, not color alone: an inline note such as "This quiz is archived and is read-only." in `text-caption text-text-muted`, in addition to the status badge.

This is the cleanest behavior given the backend asymmetry, and it means the page never sends a child mutation against an archived quiz (so the missing guards are never exercised through the UI).

> **The limitation, and why archived is knowable here (unlike the content builder).** The content-builder spec could not pre-disable archived actions because course status was absent from its content response. Here it is different: `QuizResponse.status` is present on every quiz row (verified, §2), so the UI **does** know each quiz's status on load and can render the read-only treatment proactively. No reactive-400 guessing is needed for the common case; the inline-400 handling (§9) is only a safety net for a quiz archived in another tab mid-session.

---

## 12. Design Constraints (compliance notes)

This page must **not** use any of the following (per DESIGN.md, PRODUCT.md, and the task direction):

- **Marketing hero / full-bleed Salem band.** Product workspace only; `px-8 py-8 pb-14 max-w-container mx-auto` inside `InstructorLayout`.
- **`Stat` primitive / hero-metric template** (big number + label + gradient accent). The only count surface is the quiet inline summary strip (`text-body-sm`) and per-quiz/question counts (`text-caption`).
- **`SectionHeader` / `Container`** marketing primitives.
- **Leaderboard, XP, trophy, or achievement language**; no `Anzac`/`Coral` decoration (those are earned status colors only).
- **Fake learner data**: no attempt counts, scores, results, pass rates, completion, ratings, timing/duration, price, or certificate language anywhere. None has a backend source.
- **Glassmorphism, gradient text, colored left/right accent stripes > 1px, card shadows at rest** (Flat-At-Rest Rule). Cards are `bg-surface border border-border-default rounded-lg`, flat.
- **Salem overuse.** Salem appears only as the single primary "Create quiz" button, focus rings, and the inherited user-chip tint. Well under the 15% surface budget; no Salem-filled button grids.
- **Identical-card 3-column grids.** The page is a vertical list with inline expansion, not a repeating card grid.
- **Em dashes in UI copy.** Use commas, colons, periods.
- **Status by color alone.** Quiz status uses a `Badge` with the status word; option correctness uses an icon plus the word "Correct"; archived read-only uses an inline text note. Color is always backed by text.

Typography stays single-typeface Inter at the established scale: `text-title` (h1), `text-title-sm` (quiz titles, panel headings), `text-body-sm` (question/option text, body), `text-caption` (counts, meta, confirm prompts, advisory notes). Three-tier depth max: `bg-bg-base` → `bg-surface` → `bg-surface-elevated`.

---

## 13. Backend Read-Endpoint Requirements (must precede frontend implementation)

This is the exact backend gap. Two `GET` endpoints are required before the frontend can be built. They add **no new entities and no new columns**; they read the existing `Quiz` / `Question` / `AnswerOption` graph and reuse existing DTOs.

### 13.1 List quizzes for a course

```
GET /api/v1/instructor/courses/{courseId}/quizzes
```

- **Guard**: `@PreAuthorize("hasRole('INSTRUCTOR')")` (class level, already present) plus the same `checkTeacherOwnership(course, currentUser)` used by every mutation. Resolve the course (404 if missing), verify ownership (403 if not the owner).
- **Query**: `QuizRepository.findByCourseId(courseId)` already exists.
- **Returns**: `List<QuizResponse>` (flat rows; the existing `toResponse(Quiz)` mapper already produces each element). No questions nested in the list, to keep it cheap.
- **Mapping**: inside a `@Transactional(readOnly = true)` method so the `course`/`section` lazy associations the mapper touches (`quiz.getCourse().getId()`, `quiz.getSection()`) resolve without a `LazyInitializationException`.

### 13.2 Fetch one quiz with its full tree

```
GET /api/v1/instructor/courses/quizzes/{quizId}
```

- **Guard**: same pattern. Resolve the quiz (404 "Quiz not found"), verify ownership of `quiz.getCourse()` (403).
- **Returns**: a `QuizDetailResponse` that **composes existing DTOs** without inventing leaf fields: all `QuizResponse` fields plus `List<QuestionResponse>`, where each `QuestionResponse` already carries its `List<AnswerOptionResponse>` (the existing `toQuestionResponse` / `toAnswerOptionResponse` mappers produce these). This composition is necessary because `QuizResponse` has **no** `questions` field and the editor needs the tree.
- **Mapping**: inside a `@Transactional(readOnly = true)` method. Iterate `quiz.getQuestions()` and map each via the existing `toQuestionResponse`; that mapper already streams `question.getAnswerOptions()`. Confirm question and option ordering is deterministic (by id ascending) so the editor render is stable; add `@OrderBy("id ASC")` on the collections or order in the query if it is not already guaranteed.

### 13.3 Constraints on the additions

- **Reuse existing DTOs.** `QuizResponse`, `QuestionResponse`, `AnswerOptionResponse` already exist and are used by the mutation endpoints; reuse them. The only new type is the thin `QuizDetailResponse` composition (quiz fields + question list). Do not duplicate leaf fields.
- **Preserve ownership checks.** Both reads must run `checkTeacherOwnership` exactly like the mutations, so cross-instructor reads 403 (and reach `/unauthorized` via the interceptor).
- **Do not add new entities or columns.** No ordering column, no analytics table, no attempt model. The reads are pure projections of the current graph.
- **Map inside `@Transactional`.** Lazy associations (`course`, `section`, `questions`, `answerOptions`) are all `FetchType.LAZY`; the mapping must happen inside the transaction.

### 13.4 Integration tests to add (mirrors the existing instructor-endpoint test style)

- An instructor **can list** their own course's quizzes (200, correct count, correct statuses).
- An instructor **can fetch** their own quiz detail (200, questions and options nested correctly, including a quiz with zero questions and a question with zero options).
- **Cross-instructor access is forbidden**: instructor B requesting instructor A's course quizzes / quiz detail gets **403**.
- **Unauthenticated** request gets **401**.
- A **learner** (no instructor role) gets **403** (blocked by the class-level `hasRole('INSTRUCTOR')`).
- **Not found**: unknown `courseId` on the list and unknown `quizId` on the detail each return **404**.

---

## 14. Open Decisions

1. **Edit after publish.** The backend **allows** editing a `PUBLISHED` quiz (`updateQuiz` only blocks `ARCHIVED`), and likewise allows question/option edits on a published quiz. v1 follows the backend and keeps "Edit" available on published quizzes. Open question: should editing a published quiz be restricted or warn the instructor that learners may be mid-assessment, especially once a learner-taking flow exists? Revisit when the learner side is designed.
2. **Quiz attachment: course-only, section-only, or both.** The model supports an optional `sectionId` (course-wide when null). Should v1 offer section attachment in the create/edit form, or ship course-wide only and add section attachment later? Offering it requires loading the course's sections into the form. **Recommendation**: ship course-wide first (simpler, no extra dependency), add the optional section selector as a fast-follow. Either way, only this course's sections may be selectable to keep the 400 scope error unreachable.
3. **Restoring archived quizzes.** There is no unarchive endpoint, and `publishQuiz`/`archiveQuiz` lack status guards (§8 quirk). Should archived quizzes be restorable (a real `DRAFT`/`PUBLISHED` transition endpoint), and should the backend add explicit status guards? **Recommendation**: add explicit status guards on publish/archive and, if restore is wanted, a dedicated, guarded transition endpoint. v1 treats archived as terminal and read-only.
4. **Question ordering.** No `position`/`order` field exists on `Question`; the editor renders by id ascending. Should manual reordering be added later? **Blocked** until a backend ordering field and reorder endpoint exist. v1 appends new questions to the end.
5. **Answer-option ordering.** Same as questions: no ordering field on `AnswerOption`. v1 appends; reordering is blocked on a backend field.
6. **Multiple correct answers.** `publishQuiz` requires **at least one** correct option and does not forbid several. Should `MULTIPLE_CHOICE` be constrained to exactly one correct (radio semantics), or allow multi-correct (checkbox semantics)? v1 follows the backend (multi-correct permitted, independent toggles). If single-correct is chosen, the "Mark correct" control becomes a radio group and the backend should enforce it. Also open: should `TRUE_FALSE` be constrained to exactly two options with exactly one correct? The backend does not enforce this today.
7. **Learner quiz-taking as a separate future surface.** This page is authoring only. A learner quiz-attempt flow (rendering questions, capturing answers, scoring against `passingScore`, recording a pass/fail) is a separate future page **and** a separate backend module (attempts, submissions, scoring) that does not exist today. Out of scope here; flagged so it is not conflated with this surface.
8. **Publish validation: client mirror vs backend-owned.** The backend is the authority on publish rules. Should the client also pre-validate (disable Publish until the tree looks publishable) or stay backend-owned and surface the 400? **Recommendation**: keep the backend as the gate (surface the friendly 400, §8) and add **advisory** client hints only (§7), not a hard client block, to avoid drift if the backend rules change.

---

## 15. Implementation Readiness Checklist

- **Backend read endpoints to add (blocking):**
  - `GET /api/v1/instructor/courses/{courseId}/quizzes` → `List<QuizResponse>`, ownership-checked, `@Transactional(readOnly=true)`.
  - `GET /api/v1/instructor/courses/quizzes/{quizId}` → `QuizDetailResponse` (quiz fields + `List<QuestionResponse>`), ownership-checked, transactional.
  - Integration tests per §13.4.
- **Frontend API client to add:** `src/api/instructorQuizzes.ts` with the types in §3 and functions for the two reads plus the ten existing mutations (create/update/publish/archive quiz; add/update/delete question; add/update/delete option). Mirror `instructorCourses.ts` / `instructorCourseContent.ts` style; use the shared `api` axios instance only.
- **Route to add:** one child entry under `/instructor` in `router/index.tsx`: `courses/:courseId/quizzes` → lazy `InstructorQuizzesPage`, inheriting `InstructorRoute` + `InstructorLayout`.
- **Page to create:** `src/features/instructor/pages/InstructorQuizzesPage.tsx` per §4 to §11. Reuse `Button` (incl. `destructive` for delete confirms), `Input`/`FormField`, `Badge` (quiz status), `StatePanel`, and the `Bone` skeleton idiom. Lift the inline-confirm and `aria-live` row patterns from `InstructorCourseContentPage` / `InstructorCoursesPage`.
- **Entry point to add (fast-follow):** "Quizzes" link on `InstructorCourseContentPage` (primary); optional "Quizzes" row action on `InstructorCoursesPage` (secondary, only if it does not crowd the cluster).
- **QA scenarios:**
  - List loads, empty (no quizzes), course-not-found (404), generic error (retry).
  - Create quiz (draft) with valid + invalid title/passingScore; section-attached and course-wide.
  - Edit quiz (draft and published); confirm PUT full-replace sends all fields.
  - Expand quiz → detail tree loads; add/edit/delete question; add/edit/mark-correct/delete option.
  - Delete question shows the "and its options" cascade copy and removes nested options.
  - Publish a quiz that violates each rule (no questions / question with no options / no correct option) and confirm the friendly inline copy, not the raw "Question {id}" message.
  - Publish a valid quiz → status flips to PUBLISHED; Publish action disappears, Edit/Archive remain.
  - Archive a quiz → row and editor become read-only (no mutation controls), read-only text note shown.
  - Cross-instructor `courseId`/`quizId` → `/unauthorized` (interceptor); unauthenticated → `/login`; learner → `/unauthorized`.
  - Keyboard-only pass: every add/edit/save/cancel/delete/confirm/publish/archive control reachable; visible focus; 44px hit areas; `role="alert"` errors announced; correct-state and archived-state conveyed by text, not color alone.

### Accessibility (§11-equivalent requirements, consolidated)

- One `h1` ("Quizzes"). Each **quiz title is an `h2`**; the side-panel "Create a quiz" heading is an `h2`. Question content is body text within a list, not a heading; option text likewise. Do not skip heading levels.
- Every action button carries a context `aria-label`: "Publish quiz {title}", "Archive quiz {title}", "Edit quiz {title}", "Add question to quiz {title}", "Edit question {excerpt}", "Delete question {excerpt}", "Mark option {excerpt} correct", "Delete option {excerpt}", and the "Confirm delete ..." variants. A wall of unlabeled "Edit"/"Delete" buttons fails screen-reader users.
- Forms have **visible labels** (title, description, passing score, section, question content, points, type, option text, correct). The `isCorrect` and "mark correct" controls have explicit text labels.
- **Correct-answer state is visible text** (icon + "Correct"), never color alone. **Archived read-only state is text** (badge + note), never color alone.
- Inline errors use `role="alert"`; wrap each row's action/error area in `aria-live="polite"` (the `InstructorCourseContentPage` pattern) so success/failure is announced without stealing focus.
- **Focus management**: after add-question/add-option success, keep focus in the relevant input for rapid entry; after edit, return focus to the originating "Edit" button; after delete, move focus to a stable nearby element (never a removed node).
- **No nested interactive elements**: quiz rows, question rows, and option rows are containers; their action buttons are siblings, not nested inside a clickable card.
- Keep the shared `focus-visible` Salem outline on every control; maintain `min-h-[44px]` hit areas; route transitions through `motion-safe:` for `prefers-reduced-motion`.
