# Instructor Course Content Builder Page, UI & Interaction Specification

> No-implementation spec. This document defines the instructor-facing **course content builder**: the focused workspace where an approved instructor creates and organizes the sections and lessons inside one of their own courses. It is a documentation and design task only. Do not implement the React page from this document without a follow-up task.
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use across `InstructorCoursesPage.tsx`, `InstructorLayout.tsx`, `Button.tsx`, `Badge.tsx`, `Input.tsx`, and `StatePanel.tsx`. Where a role has no defined token, it is flagged as a design decision, not invented.

---

## 0. Scope & Assumptions

This is the second instructor-facing product surface in Learnova, the layer beneath the course list at `/instructor/courses`. Where the list page manages course lifecycle (draft, published, archived), this page manages what is **inside** one course: its sections and the lessons within them. It is the structure that the learner course player (`CoursePlayerPage`, `/dashboard/courses/:courseId`) reads and renders.

**This is product UI, not marketing UI.** It is not a public catalog, not a marketplace, and not an analytics dashboard. It should feel like a calm course-building workspace: structure editing, safe content actions, and clarity above all.

**In scope for v1:**

- Loading the section and lesson structure of one owned course through the real content endpoint.
- Creating a section (title only).
- Renaming a section (title only).
- Deleting a section, with a confirm step, knowing the backend cascades its lessons and their learner progress.
- Creating a lesson inside a section (title only).
- Renaming a lesson (title only).
- Deleting a lesson, with a confirm step, knowing the backend removes its learner progress.
- Loading, empty, and error states, plus calm handling of the 409 archived-course response.

**Out of scope for v1 (do not build, do not imply in the UI):**

- Video upload, file upload, or any media attachment (no backend endpoint, no DTO field).
- Rich text or HTML lesson body (no `body`/`content` field on `InstructorLessonResponse`).
- Quizzes, questions, and answer options (separate instructor endpoints exist; they are a different surface, see §15).
- Drag and drop, or any manual reordering of sections or lessons (no ordering field exists; see §2 and §15).
- Analytics, enrollment counts, completion rates, or any learner-facing metric.
- A learner preview rendered inside this page (the instructor is not necessarily enrolled in their own course, so the learner content endpoint would return 404; see §1 and §5).
- Lesson-level progress display (the instructor DTOs deliberately carry no progress fields).

**Access assumption.** This page is **instructor-only** and must sit behind `InstructorRoute`. The guard already exists (`frontend/src/components/common/InstructorRoute.tsx`) and checks `isAuthenticated` plus `user.availableProfiles.includes('INSTRUCTOR')`, redirecting unauthenticated users to `/login` and authenticated-but-not-instructor users to `/unauthorized`. The backend `availableProfiles` remains the single source of truth for instructor access. Do not infer instructor access from `activeProfile` alone or from stale localStorage.

**Continuity assumption.** Learners see the result immediately. The learner `CoursePlayerPage` consumes `GET /api/v1/learner/courses/{courseId}/content`, which reads the same `Section` and `Lesson` entities this page writes. A section or lesson created here appears in an enrolled learner's outline on their next load, with no extra publish step for content (course-level publish is separate and lives on the list page).

**No blockers for the core flow.** Unlike the instructor course list spec (which was written before its list endpoint existed), every endpoint this page needs is implemented and verified (§2). The page is buildable against real data today. The only limitations are scoping decisions (no reorder, no media, no archived pre-disable), all documented in §11 and §15.

---

## 1. Route & Access

### Recommended route

```
/instructor/courses/:courseId/content
```

Register it as a child of the existing `/instructor` route in `frontend/src/router/index.tsx`, as a sibling of the current `courses` child. The `/instructor` parent is already wrapped in `InstructorRoute` and renders `InstructorLayout` (verified in `router/index.tsx` lines 160 to 181). A new child therefore inherits both the guard and the instructor shell with no additional wiring beyond the route entry and a lazy import.

```tsx
// Conceptual placement in src/router/index.tsx (do not implement in this task).
// Sibling of the existing { path: 'courses', ... } child under '/instructor'.
{
  path: 'courses/:courseId/content',
  element: (
    <Suspense fallback={<DashboardPageSkeleton />}>
      <InstructorCourseContentPage />
    </Suspense>
  ),
}
```

The static `courses` child (the list) and the parameterized `courses/:courseId/content` child resolve without conflict in React Router v7. No existing route is displaced.

### Guard

**`InstructorRoute`**, inherited from the `/instructor` parent. Do not add a second guard and do not duplicate authorization logic inside the page. The page may assume that if it renders, the viewer is an approved instructor. Redirect behavior is owned by the guard:

- Not authenticated, redirect to `/login`.
- Authenticated but `availableProfiles` does not include `'INSTRUCTOR'`, redirect to `/unauthorized`.

### Shell

**Use the existing `InstructorLayout`** (`frontend/src/features/instructor/components/InstructorLayout.tsx`). It already provides the instructor topbar (back-to-dashboard link, logo, a "Teaching" pill, notifications, and a user chip reading "{name} / Instructor"), a skip-to-content link, and a scrollable `<main id="main-content">`. Rendering this page as a child of `/instructor` places it inside that shell automatically. This spec therefore covers **only the content column**, not page chrome. Do not introduce a new layout.

### Status-code behavior the page handles locally

The backend enforces ownership and approval on every endpoint (verified in `InstructorCourseContentService`). Most failures are handled by the global Axios interceptor; only a few are page-local.

| Result | Source (verified) | Page behavior |
|---|---|---|
| **401 Unauthorized** | global Axios interceptor (`setupApiInterceptors`) | `logout()` + redirect to `/login`. Page does not handle. |
| **403 Forbidden** | global Axios interceptor | redirect to `/unauthorized`, no logout. Page does not handle. This covers cross-instructor access: `resolveOwnedCourse` throws 403 ("You are not the owner of this course") when `courseId` belongs to another instructor, and `resolveApprovedInstructorProfile` throws 403 when the profile is not `APPROVED`. |
| **404 Not Found** | `resolveOwnedCourse` throws 404 ("Course not found") for a missing or unknown `courseId` | page-local: render the **course-not-found state** (§12), a calm panel with a link back to `/instructor/courses`. Do not retry a 404. |
| **409 Conflict** | `rejectIfArchived` throws 409 ("Archived courses cannot be modified") on any mutation against an archived course | page-local: render a calm **inline** message at the action site (§11), never a page-level red banner. The GET content read itself does not throw 409, so the page still loads and lists content for an archived course; only mutations fail. |

> Note on the 403 path for cross-instructor access. Because the shared interceptor redirects 403 to `/unauthorized`, an instructor who opens another instructor's `courseId` is sent to `/unauthorized` rather than seeing an in-page message. That is the established app-wide behavior and this page must not override it. If a softer in-page "not your course" state is ever wanted, that is an interceptor-level decision, not a page-level one (see §15).

### Entry point (future wiring, noted for continuity)

Add a "Manage content" action to each row on `InstructorCoursesPage` later, linking to `/instructor/courses/{id}/content`. That wiring is its own task (see §15); it is not built here, and this page must function when reached by direct URL.

---

## 2. Backend Contract

All paths, status codes, request shapes, and error semantics below are verified against `InstructorCourseContentController.java` and `InstructorCourseContentService.java`. Do not assume any field or behavior not listed here.

### Endpoints

| Method | Path | Success | Request body | Returns |
|---|---|---|---|---|
| GET | `/api/v1/instructor/courses/{courseId}/content` | 200 | none | `InstructorCourseContentResponse` |
| POST | `/api/v1/instructor/courses/{courseId}/sections` | **201 Created** | `CreateSectionRequest` | `InstructorSectionResponse` (with empty `lessons`) |
| PATCH | `/api/v1/instructor/courses/sections/{sectionId}` | 200 | `UpdateSectionRequest` | `InstructorSectionResponse` (with current `lessons`) |
| DELETE | `/api/v1/instructor/courses/sections/{sectionId}` | **204 No Content** | none | empty body |
| POST | `/api/v1/instructor/courses/sections/{sectionId}/lessons` | **201 Created** | `CreateLessonRequest` | `InstructorLessonResponse` |
| PATCH | `/api/v1/instructor/courses/lessons/{lessonId}` | 200 | `UpdateLessonRequest` | `InstructorLessonResponse` |
| DELETE | `/api/v1/instructor/courses/lessons/{lessonId}` | **204 No Content** | none | empty body |

Auth on every endpoint: `@PreAuthorize("hasRole('INSTRUCTOR')")` plus a service-level approved-profile check and a course-ownership check.

### Response DTOs (exhaustive, verified field for field)

```jsonc
// InstructorCourseContentResponse
{
  "courseId": 12,        // Long
  "courseTitle": "Advanced React Patterns",  // String, use as the page title
  "sections": [          // List, may be empty; ordered by section id ascending
    {
      // InstructorSectionResponse
      "id": 100,         // Long
      "title": "Getting Started",  // String
      "lessons": [       // List, may be empty; ordered by lesson id ascending
        {
          // InstructorLessonResponse
          "id": 1001,    // Long
          "title": "Course Overview"  // String
        }
      ]
    }
  ]
}
```

> **Fields that DO NOT exist** on these DTOs and must not be rendered or implied: lesson body, video URL, content URL, duration, lesson type, attachments, quiz count or quiz reference, section description, lesson `completed`/progress, course status, instructor name, category, `createdAt`/`updatedAt`, and any `position`/`order`/`sortIndex`. The instructor content DTOs are intentionally leaner than the learner content DTOs (`LessonContentResponse` carries `completed`, `lastPositionSeconds`, `timeSpentSeconds`; the instructor one does not).

> **Ordering is implicit.** Sections come back via `findByCourseIdOrderByIdAsc` and lessons via `findBySectionIdOrderByIdAsc`. There is no client-controllable order. A newly created section or lesson always sorts last by id, so it appends to the end of its list. The UI must present creation as "add to the end" and must not imply the instructor can choose a position.

### Request DTOs (verified constraints)

```jsonc
// CreateSectionRequest  AND  UpdateSectionRequest  (identical shape)
{ "title": "Getting Started" }   // @NotBlank, @Size(max = 200)

// CreateLessonRequest  AND  UpdateLessonRequest  (identical shape)
{ "title": "Course Overview" }   // @NotBlank, @Size(max = 200)
```

Every section and lesson request is a single `title` field: required (`@NotBlank`) and capped at **200 characters** (`@Size(max = 200)`). The service trims the title server-side (`request.title().trim()`) before persisting, so leading and trailing whitespace is removed regardless of client input.

### Verified error semantics

| Condition | Status | Message (server) |
|---|---|---|
| Instructor profile missing or not `APPROVED` | 403 | "Instructor profile not found" / "Your instructor profile is not approved yet" |
| `courseId` not found | 404 | "Course not found" |
| Course owned by another instructor | 403 | "You are not the owner of this course" |
| `sectionId` not found | 404 | "Section not found" |
| Section owned by another instructor | 403 | "You are not the owner of this section" |
| `lessonId` not found | 404 | "Lesson not found" |
| Lesson owned by another instructor | 403 | "You are not the owner of this lesson" |
| Any mutation on an `ARCHIVED` course | 409 | "Archived courses cannot be modified" |
| Blank or over-200-char title | 400 | Bean Validation message |

### Verified cascade behavior (drives the delete copy in §10)

- **Delete section**: the service deletes, in FK-safe order, the lesson progress rows for the section, then the lessons in the section, then the section itself (`lessonProgressRepository.deleteBySectionId`, `lessonRepository.deleteBySectionId`, `sectionRepository.deleteByIdDirect`). Deleting a section therefore destroys its lessons and all learner progress for those lessons. This is irreversible and there is no restore endpoint.
- **Delete lesson**: the service deletes the lesson's progress rows, then the lesson (`lessonProgressRepository.deleteByLessonId`, `lessonRepository.delete`). Deleting a lesson destroys learner progress for that lesson. Irreversible, no restore endpoint.

### Frontend client status

There is **no** `src/api/instructorCourseContent.ts` and **no** `useInstructorCourseContent` hook today (the existing `src/api/instructorCourses.ts` covers only course-level CRUD: `getMyInstructorCourses`, `createInstructorCourse`, `updateInstructorCourse`, `publishInstructorCourse`, `archiveInstructorCourse`). Both the content client and a hook (or local fetch in the page) are net-new and belong to the follow-up implementation task, not this spec.

---

## 3. State Model

Frontend types mirror the backend DTOs exactly. No invented fields.

```ts
// src/api/instructorCourseContent.ts (net-new)
export type InstructorLessonResponse = {
  id: number;
  title: string;
};

export type InstructorSectionResponse = {
  id: number;
  title: string;
  lessons: InstructorLessonResponse[];
};

export type InstructorCourseContentResponse = {
  courseId: number;
  courseTitle: string;
  sections: InstructorSectionResponse[];
};

// Request payloads (single title field each, max 200 chars).
export type SectionTitlePayload = { title: string };
export type LessonTitlePayload = { title: string };
```

### Local UI state (page component)

| State | Type | Purpose |
|---|---|---|
| `content` | `InstructorCourseContentResponse \| null` | The fetched structure. The single source of truth for what renders. |
| `loading` | `boolean` | Initial content fetch in flight. Drives the skeleton (§12). |
| `error` | `'none' \| 'notFound' \| 'generic'` | A plain boolean is insufficient: 404 (course not found) and 500 (generic) render different states (§12). |
| `addingSection` | `boolean` | The new-section inline form is open. |
| `editingSectionId` | `number \| null` | Section currently in inline rename mode. |
| `addingLessonSectionId` | `number \| null` | Section whose inline add-lesson form is open. |
| `editingLessonId` | `number \| null` | Lesson currently in inline rename mode. |
| `deleteTarget` | `{ kind: 'section' \| 'lesson'; id: number; title: string } \| null` | The item awaiting delete confirmation (§10). |
| `pendingActionId` | `string \| null` (or a `Set<string>`) | Keys such as `"section:100"` or `"lesson:1001"` whose create/rename/delete request is in flight. Used to drive per-row `Button loading` and to disable sibling actions on that row. |
| `rowErrors` | `Record<string, string>` | Map from a row key to a calm inline error message, including the 409 archived case (§11). |
| `draftTitle` | `string` | The working value of whichever inline form is currently open. Reset on open and on cancel. |

Derived (not stored): `totalSections = content.sections.length`, `totalLessons = sum of section.lessons.length`. Recomputed on every successful mutation.

> Do not add any lesson body, media, duration, ordering, or progress state. None of it has a backend source in v1.

---

## 4. Layout & Structure

### Page shell

Use the canonical product page shell, identical to `InstructorCoursesPage` and the dashboard pages:

```html
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

No `Container` primitive (that is the marketing width primitive). No `SectionHeader`, no `Stat`, no full-bleed marketing `<section>` bands.

### Top-to-bottom structure

1. **Back link** to `/instructor/courses` (§5).
2. **Header**: course title (`h1`), one helper line (§5).
3. **Summary strip**: an inline "N sections / M lessons" line, not `Stat` (§6).
4. **Builder body**: a two-column grid on desktop.
   - **Main (left):** the section and lesson list (§7, §8).
   - **Side (right):** a guidance and add-section panel (§9).
5. **Loading / empty / not-found / error** states replace the body (§12).

### Desktop grid

```html
<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
  <!-- main: section + lesson list -->
  <!-- aside: add-section + guidance panel -->
</div>
```

`minmax(0,1fr)` on the main column prevents long section or lesson titles from forcing horizontal overflow. The side column is a fixed `320px` rail on `lg`.

### Mobile behavior

On `< lg`, the layout collapses to a single column. The side column (§9) renders **above** the main list so the primary "Add section" action is reachable without scrolling past the whole tree. Inside the side panel, the guidance text may be hidden on mobile (`hidden lg:block`) to keep the add action close to the top; the add-section control itself always renders. The filter-tabs idiom from the list page is not used here (there is nothing to filter).

### Wireframe (lg)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside InstructorLayout > main)
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to teaching courses                    (text-body-sm, secondary)│
│                                                                        │
│ Advanced React Patterns                       (h1 · text-title / 600)  │
│ Organize the sections and lessons learners will see in the course      │
│ player.                                       (text-body-sm secondary) │
│                                                                        │
│ 3 sections · 12 lessons                       (summary strip)          │
│                                                                        │
│ grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]                          │
│ ┌───────────────────────────────────┐ ┌────────────────────────────┐  │
│ │ MAIN: section list                │ │ ASIDE                      │  │
│ │ ┌───────────────────────────────┐ │ │ ┌────────────────────────┐ │  │
│ │ │ Getting Started   ·  2 lessons│ │ │ │ Add a section          │ │  │
│ │ │      [Add lesson][Edit][Delete]│ │ │ │ [ Section title____ ]  │ │  │
│ │ │  · Course Overview  [Edit][Del]│ │ │ │ [ Add section ]        │ │  │
│ │ │  · Setup Editor     [Edit][Del]│ │ │ └────────────────────────┘ │  │
│ │ └───────────────────────────────┘ │ │ Guidance:                  │  │
│ │ ┌───────────────────────────────┐ │ │ Sections group related     │  │
│ │ │ Core Concepts     ·  0 lessons│ │ │ lessons. Learners see this │  │
│ │ │      [Add lesson][Edit][Delete]│ │ │ order in the player.       │  │
│ │ │  No lessons in this section yet│ │ │                            │  │
│ │ └───────────────────────────────┘ │ └────────────────────────────┘  │
│ └───────────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Responsive table

| Breakpoint | Shell | Columns | Side panel placement |
|---|---|---|---|
| base (`< 1024px`) | `px-8 py-8 pb-14 max-w-container mx-auto` | single column | Add-section panel above the list; guidance text may be hidden |
| `lg` (1024px+) | same | `lg:grid-cols-[minmax(0,1fr)_320px]`, `gap-4` | Right rail, always visible |

> Tightening horizontal padding on mobile (`px-4 sm:px-8`) is the same open refinement flagged in the list and player specs. v1 keeps a flat `px-8` to match every other product shell. Do not decide it here.

### Vertical rhythm

- Back link `mb-4`. Header block `mb-8`. Summary strip `mb-8`. Grid sections internally use `gap-4`.
- Section cards: `gap-3` between cards in the list (`flex flex-col gap-3` or `space-y-3`).
- Inside a section card: `p-4`; section title to action row `mb-3`; action row to lesson list `mb-2`.
- Lesson rows: `gap-1` between rows.

---

## 5. Header

Renders above the grid.

| Element | Content | Typography | Weight | Color | Spacing |
|---|---|---|---|---|---|
| Back link | "← Back to teaching courses" to `/instructor/courses` | `text-body-sm` | 500 | `text-text-secondary` hover `text-text-primary` | `mb-4`, `gap-1`, `focus-visible:outline-salem` |
| H1 | `content.courseTitle` if loaded, else the fallback "Course content" | `text-title` | `font-semibold` (600) | `text-text-primary` | header block `mb-8` |
| Subtitle | "Organize the sections and lessons learners will see in the course player." | `text-body-sm` | 400 | `text-text-secondary` | `mt-1` |

**Page title rule.** Use `content.courseTitle` from the content API as the H1 once loaded. Before the content resolves (skeleton state) and in the generic-error state, fall back to the literal **"Course content"**. Render the back link and a title skeleton during load so the header is stable.

**No secondary "View learner player" action in v1.** The only learner content route is `/dashboard/courses/:courseId`, gated by enrollment server-side. An instructor is not necessarily enrolled in their own course, so that route would return 404 for them. There is no instructor-facing preview endpoint. Per the task direction, do not add a fake or broken preview link. A real preview is an open decision (§15).

The header carries **no** primary button. The single primary action on the page is "Add section" in the side panel (§9), keeping the Forest Rule (one primary per zone) intact.

---

## 6. Summary Strip

A single inline line beneath the header, mirroring the dashboard and list-page summary idiom. It is **not** the `Stat` primitive and not a hero-metric grid.

- Wrapper: `text-body-sm text-text-secondary mb-8`, `flex flex-wrap items-center` so it wraps on mobile.
- Count numerals use `font-semibold text-text-primary`; the surrounding words stay secondary.
- Dot separator: a `·` in `text-border-hover`, `aria-hidden`, with horizontal margin, matching the list page's separator treatment.

Example rendered output:

```
3 sections · 12 lessons
```

Rules:

- `sections` count is `content.sections.length`. `lessons` count is the sum of `section.lessons.length` across all sections.
- Pluralize: "1 section" / "2 sections", "1 lesson" / "2 lessons".
- When the course has zero sections, the summary strip is not shown; the empty state (§12) carries the message instead.
- Counts recompute on every successful create or delete. They are not a separate fetch.

Do not add duration, enrollment, completion, rating, price, or XP to this line. None of it has a source.

---

## 7. Section List Specification

The main column is a vertical list of section cards. Each card owns its lessons.

### Section card surface

| Property | Token |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border-default` |
| Radius | `rounded-lg` |
| Padding | `p-4` |
| Shadow at rest | none (Flat-At-Rest Rule) |
| Hover | none (the card is not a single clickable target; it holds multiple controls) |

### Section card contents

1. **Section title row** (`flex flex-wrap items-start justify-between gap-x-4 gap-y-2 mb-3`):
   - **Title**: `h2` (see §13 heading order), `text-title-sm font-semibold text-text-primary`, `line-clamp-2` acceptable. (In rename mode this is replaced by an inline input, §9.)
   - **Lesson count**: a quiet inline label next to or below the title, `text-caption text-text-muted`, reading "2 lessons" / "1 lesson" / "0 lessons". Status by text, never an icon-only signal.
   - **Section actions** (right-aligned, secondary and ghost weight):
     - **Add lesson**: `Button variant="secondary" size="sm"`. Opens the inline add-lesson form for this section (§9).
     - **Edit section**: `Button variant="ghost" size="sm"`. Enters inline rename mode (§9).
     - **Delete section**: `Button variant="ghost" size="sm"`. Opens the section delete confirm step (§10).
2. **Lesson list** (§8): a `<ul>` of lesson rows, or the empty-section line below.
3. **Inline add-lesson form** when open for this section (§9), rendered at the end of the lesson list.

### Empty section

When `section.lessons.length === 0`, render a single calm line in place of the list:

```
No lessons in this section yet.
```

`text-caption text-text-muted`, with the "Add lesson" action still present in the section header. No panel, no border, no illustration.

---

## 8. Lesson Row Specification

Each lesson is a single row inside its section's lesson list.

- Layout: `flex items-center justify-between gap-2`, `min-h-[44px]`, `px-2 py-2`, `rounded-md`.
- Optional tonal separation: a top border (`border-t border-border-default`) between rows, or a subtle `bg-surface-elevated` on hover. **No card, no shadow** at the row level. Do not use a colored left-border accent stripe (DESIGN.md prohibits border accents greater than 1px as a colored stripe).
- **Lesson title**: `text-body-sm text-text-primary`, `line-clamp-1` or `line-clamp-2`. (In rename mode this is replaced by an inline input, §9.)
- **Lesson actions** (right-aligned):
  - **Edit lesson**: `Button variant="ghost" size="sm"`.
  - **Delete lesson**: `Button variant="ghost" size="sm"`. Opens the lesson delete confirm step (§10).

**Do not show** on a lesson row: completion status, progress, duration, content type, media icon, lesson body preview, or quiz indicator. None of these fields exist on `InstructorLessonResponse` (§2). The row is title plus two actions, nothing more.

---

## 9. Create / Edit Behavior

**Use inline forms, not modals.** The existing `InstructorCoursesPage` uses a modal for course create/edit because that form has five fields and an async categories dependency. The content builder is the opposite case: every form here is a **single title field** with no async dependency. Inline forms keep the instructor in the structure they are editing, avoid focus churn between many modals, and read as a calmer workspace. This is the simpler implementation path and the one this spec defines.

### Add section (side panel, §4)

- Location: the add-section panel in the right rail (or above the list on mobile).
- Surface: `bg-surface border border-border-default rounded-lg p-4`, no shadow at rest.
- Heading: "Add a section", `text-title-sm font-semibold text-text-primary mb-3`.
- Control: a single `Input` (title) plus a `Button variant="primary" size="md"` labeled "Add section". This is the **one primary button on the page**.
- The input may always be visible in the panel (no separate open/close toggle needed for the side panel), since it is the panel's whole purpose.
- On submit: `POST /api/v1/instructor/courses/{courseId}/sections` with `{ title }`. On 201, append the returned `InstructorSectionResponse` (which has an empty `lessons` array) to `content.sections`, clear the input, keep focus in the input so the instructor can add the next section, and recompute the summary strip.

### Edit section (inline rename)

- Trigger: "Edit section" in the section header (§7).
- Presentation: replace the section title text with an `Input` pre-filled with the current title, plus a "Save" `Button variant="secondary" size="sm"` and a "Cancel" `Button variant="ghost" size="sm"`. Only one section may be in rename mode at a time (`editingSectionId`).
- On submit: `PATCH /api/v1/instructor/courses/sections/{sectionId}` with `{ title }`. On 200, replace that section's `title` in place (the response also returns current `lessons`; either keep the local lessons or adopt the response's, they match), exit rename mode, and return focus to the section's "Edit section" button.
- Cancel restores the original title and exits rename mode without a request.

### Add lesson (inline, inside a section)

- Trigger: "Add lesson" in the section header (§7).
- Presentation: an inline form at the end of that section's lesson list: an `Input` (lesson title) plus "Add" `Button variant="secondary" size="sm"` and "Cancel" `Button variant="ghost" size="sm"`. Controlled by `addingLessonSectionId`.
- On submit: `POST /api/v1/instructor/courses/sections/{sectionId}/lessons` with `{ title }`. On 201, append the returned `InstructorLessonResponse` to that section's `lessons`, clear the input, keep the form open with focus in the input for rapid entry of the next lesson, and recompute the summary strip.

### Edit lesson (inline rename)

- Trigger: "Edit lesson" in the lesson row (§8).
- Presentation: replace the lesson title with an `Input` pre-filled with the current title, plus "Save" and "Cancel" as above. Only one lesson in rename mode at a time (`editingLessonId`).
- On submit: `PATCH /api/v1/instructor/courses/lessons/{lessonId}` with `{ title }`. On 200, replace the lesson's `title` in place, exit rename mode, return focus to the row's "Edit lesson" button.

### Validation (mirror the verified backend constraints)

- **Required**: title must be non-blank after trim. The backend trims server-side; the client should also trim before sending and block submission of an empty result.
- **Max length**: 200 characters (`@Size(max = 200)`). Enforce client-side for fast feedback. The `Input` may carry a slightly higher `maxLength` (for example 210) so the user can see the over-limit state and the inline error rather than being silently clipped, matching the pattern in `InstructorCoursesPage` (`maxLength={210}` with a 200 message).
- **Inline error**: show a calm message below the field, `text-body-sm text-error`, `role="alert"`. Suggested copy: "Title is required." and "Title must not exceed 200 characters."
- **Backend validation error (400)**: map to the same field-level inline message; do not surface a page-level banner for a title-length failure.

### After any successful mutation

- Update local `content` state in place from the response. Do not reload the full page or re-fetch the whole content tree (re-fetch is acceptable as a simpler fallback but the in-place update is preferred and keeps scroll position).
- Preserve scroll position. Inline forms make this natural since the DOM around the edit point is stable.
- Clear the relevant `pendingActionId` and any `rowErrors` entry for that key.

While a create, rename, or delete request is in flight, use the `Button` `loading` prop on the specific submit button and disable the sibling controls on that row (via `pendingActionId`). Do not block the whole list.

---

## 10. Delete Behavior

Both deletes are destructive and irreversible (no restore endpoint), and both cascade learner data (§2). Each delete therefore requires an explicit confirm step. Use a lightweight inline confirm affordance, the same pattern already shipped in `InstructorCoursesPage` (an inline "Archive this course? [Cancel] [Archive]" row), not a heavy modal system.

### Section delete

- Trigger: "Delete section" in the section header.
- Confirm step (inline, replacing the section's action cluster):
  - Prompt: **"Delete this section and its lessons?"** in `text-caption text-text-secondary`.
  - Cancel: `Button variant="ghost" size="sm"`.
  - Confirm: `Button variant="destructive" size="sm"` labeled **"Delete section"**, with `aria-label="Confirm delete section {title}"`. The `destructive` variant (Error fill, white text) is the sanctioned style for a destructive confirmation in DESIGN.md and is available in `Button.tsx`.
- On confirm: `DELETE /api/v1/instructor/courses/sections/{sectionId}`. On 204, remove the section from `content.sections`, recompute the summary strip (both section and lesson counts drop), and return focus to a stable element (the next section's heading, or the add-section input if the list is now empty).

### Lesson delete

- Trigger: "Delete lesson" in the lesson row.
- Confirm step (inline, replacing the lesson's action cluster):
  - Prompt: **"Delete this lesson?"** in `text-caption text-text-secondary`.
  - Cancel: `Button variant="ghost" size="sm"`.
  - Confirm: `Button variant="destructive" size="sm"` labeled **"Delete lesson"**, with `aria-label="Confirm delete lesson {title}"`.
- On confirm: `DELETE /api/v1/instructor/courses/lessons/{lessonId}`. On 204, remove the lesson from its section's `lessons`, recompute the lesson count, and if the section is now empty show the empty-section line (§7). Return focus to the section's "Add lesson" button or the next lesson row.

### After delete

- Remove the item from local state; never leave a stale row.
- Update summary counts.
- Show the empty-section state where a section's last lesson was removed.

**No undo.** There is no backend restore path; do not present an undo affordance that cannot be honored. The confirm step is the safety mechanism. Whether deletion should require typed confirmation (typing the title) is an open decision (§15); v1 uses the single-click confirm step described above, consistent with the existing archive pattern.

---

## 11. Archived Course Behavior

The backend rejects every mutation on an archived course with **409** ("Archived courses cannot be modified", verified in `rejectIfArchived`). The **GET content read does not 409**, so an archived course still loads and lists its sections and lessons normally.

**The limitation: course status is not in the content response.** `InstructorCourseContentResponse` carries `courseId`, `courseTitle`, and `sections` only (§2). It does **not** include the course's `status`. The UI therefore cannot know on load whether the course is archived, and cannot pre-disable or hide the create, rename, and delete actions for an archived course.

**v1 behavior (handle the 409 calmly, reactively):**

- Allow the action click. When any mutation returns 409, do not treat it as a page error. Write a calm inline message into `rowErrors` at the action site:
  - Copy: **"Archived courses cannot be edited."**
  - Style: `text-caption text-text-muted` (or `text-body-sm text-error` for a field-level form error), with `role="alert"`, placed beside or below the control that failed. Not a page-level red banner.
- Leave the structure visible and readable. The instructor can still see what the course contains.

**Do not guess status.** Do not hide actions based on any inferred or stale status; there is no status to read. The pre-disable behavior is **blocked** until the content response includes course status, which is the recommended backend change in §15. Mark this clearly as a backend and UI limitation in the implementation task.

> Optional hardening (not required for v1): the page already knows `courseId`. If a future task wants to pre-disable actions, the cheapest path is adding `status` to `InstructorCourseContentResponse`; a second-best path is a separate fetch of the course via the instructor course list, but that is a heavier dependency and is not recommended here.

---

## 12. Loading, Empty, and Error States

All states render inside the page shell. The header (back link plus a title or its skeleton) stays stable across states where practical.

### Loading

Skeleton blocks (no spinner), matching the real layout and reusing the `Bone` idiom already used by `InstructorCoursesPage`:

- Header: a title bone (`h-7 w-64`) and a subtitle bone (`h-4 w-80`).
- Summary: a short bone (`h-4 w-40`).
- Grid: two or three section-card skeletons in the main column (each `rounded-lg border border-border-default bg-surface p-4` with a title bone, a short action-row bone, and one or two lesson-row bones), and an add-section panel skeleton in the side column.
- Wrapper `aria-hidden="true"`. No page-level spinner; spinners are reserved for in-button loading.

### Empty (200, zero sections)

The course exists and is owned by the instructor but has no sections yet. Use a calm bordered panel in the `StatePanel` idiom (or `StatePanel` directly), spanning the main column, with the add-section panel still present in the side column:

- Title: **"No content yet"** (`text-body-sm font-medium text-text-primary`).
- Body: **"Create the first section to start building this course."** (`text-body-sm text-text-secondary`).
- Action: an **"Add section"** affordance. Either point the instructor to the side-panel input (which is already visible) or render one "Add section" `Button variant="primary" size="md"` in the panel that focuses the side-panel input. Keep a single primary visible at a time (Forest Rule).

### Course not found (404)

The `courseId` is missing, unknown, or (via the interceptor path) not the instructor's. For a true 404 from `resolveOwnedCourse`, render a `StatePanel` with no retry (retrying a 404 is pointless):

- Title: **"Course not found"**.
- Body: **"This course does not exist, or you do not have access to it."**
- Provide a quiet Salem text-link back to **`/instructor/courses`** ("Back to teaching courses"), matching the header back-link treatment.

> Cross-instructor access (403) does not reach this state; the global interceptor redirects it to `/unauthorized` (§1).

### Generic error (500 or any non-401/403/404 failure)

Render `StatePanel` with `onRetry`:

- Body: **"We could not load this course content."**
- Action: **"Try again"** (re-runs the content fetch; `StatePanel` renders this when `onRetry` is passed). Keep the H1 fallback "Course content" in this state since `courseTitle` is unknown.

### Mutation errors (inline, never a page-level red banner)

- **409 archived**: inline message at the action site, "Archived courses cannot be edited." (§11).
- **400 validation**: inline field error under the form input (§9).
- **404 on a stale section or lesson** (deleted between load and action): inline line, for example "This item is no longer available.", and remove the stale row or trigger a content re-fetch. Do not show a page-level error.
- **401 / 403**: not handled here. The shared Axios interceptor owns both (401 logout to `/login`, 403 to `/unauthorized`). Do not duplicate that logic.

---

## 13. Accessibility

- **Heading order**: `h1` is the course title (header). Each **section title is an `h2`**. The side panel "Add a section" heading is also an `h2` (sibling region). Lesson titles are not headings; they are content within a list (`<ul>`/`<li>`), which is the correct semantic for a flat set of items under a section. Do not skip levels and keep one `h1` per page.
- **Content-specific button labels**: every action button carries an `aria-label` naming its target, because a list of buttons all labeled "Edit" or "Delete" fails screen-reader users. Examples:
  - `aria-label="Edit section Introduction"`
  - `aria-label="Delete section Introduction"`
  - `aria-label="Add lesson to Introduction"`
  - `aria-label="Edit lesson Setup your workspace"`
  - `aria-label="Delete lesson Setup your workspace"`
  - `aria-label="Confirm delete section Introduction"`
- **Confirmation states are visible text**: the delete prompt ("Delete this section and its lessons?") is rendered text, not conveyed by color or icon alone.
- **Inline errors** use `role="alert"` so they are announced when they appear (validation errors, the 409 archived message).
- **Live regions for async outcomes**: wrap each row's action and error area in an `aria-live="polite"` region (the pattern already used in `InstructorCourseRow`) so success and failure are announced without stealing focus.
- **Focus management**: after add-section success, keep focus in the section-title input for rapid entry. After add-lesson success, keep focus in the lesson-title input. After rename, return focus to the originating "Edit" button. After delete, move focus to a stable nearby element (next section heading, the add-section input, or the section's "Add lesson" button), never to a removed node.
- **No nested interactive elements**: section cards and lesson rows are containers, not buttons. Action buttons are siblings within the row, not nested inside a clickable card.
- **Keyboard**: every action (add, edit, save, cancel, delete, confirm) is a real `<button>` or `<input>`, reachable and operable by keyboard. Tab order follows DOM order: back link, then main-column sections top to bottom (each section's actions, then its lessons), then the side panel (or side panel first on mobile, where it renders above the list).
- **Visible focus**: keep the shared `focus-visible` Salem outline on every control (the primitives ship it; do not strip it). Maintain the `min-h-[44px]` hit area used across the app.
- **Reduced motion**: route any transitions through `motion-safe:` to honor `prefers-reduced-motion`.

---

## 14. Design-Rule Compliance Notes

- **Product workspace, not marketing or catalog.** Uses the product shell (`px-8 py-8 pb-14 max-w-container mx-auto`) inside `InstructorLayout`. Deliberately avoids `Container`, `SectionHeader`, and `Stat`.
- **No marketing or catalog visuals.** No hero band, no public course cards, no thumbnails, no price, rating, discount, "best seller", or enrollment-count language anywhere. Those slots are absent from the template, which is stronger than a style rule.
- **No fake content fields.** No completion, progress, duration, media icon, lesson body, or quiz indicator is rendered, because none exists on the instructor DTOs. The page is honest about being a structure editor.
- **No large metrics.** The only count surface is the quiet inline summary strip (`text-body-sm`) and per-section lesson counts (`text-caption`). No hero-metric template, no big number with gradient accent.
- **No repeated primary-action grid.** Exactly one primary button on the page: "Add section" in the side panel. Every other action (add lesson, edit, save) is secondary or ghost; deletes use the `destructive` variant only inside a confirm step. The list never becomes a wall of Salem buttons (Forest Rule).
- **No shadows at rest.** Section cards, lesson rows, the side panel, and inline forms are flat (`bg-surface border border-border-default rounded-lg`). Tonal hover only where used. No hover-lift (these are multi-control containers, not single clickable targets).
- **Salem stays scarce.** Salem appears only as the single primary "Add section" button, focus rings, and the user-chip tint inherited from `InstructorLayout`. No Salem backgrounds, no Salem-filled button grid; well under the 15% surface budget.
- **No prohibited patterns.** No gradient text, no glassmorphism, no large Salem backgrounds, no XP, leaderboards, trophies, or achievement theater, no colored left-border accent stripes.
- **Single typeface, restrained scale.** Inter only: `text-title` (h1), `text-title-sm` (section titles, panel heading), `text-body-sm` (lesson titles, body), `text-caption` (counts, meta, confirm prompts). No in-between sizes.
- **Three-tier depth max.** `bg-bg-base` (page, from the layout) to `bg-surface` (cards, panel, inputs) to `bg-surface-elevated` (row hover, disabled inputs). Nothing nests deeper.
- **No em dashes** in any UI copy in this spec, per DESIGN.md and the task direction.

---

## 15. Open Decisions

1. **Section and lesson ordering.** Should manual reordering (drag and drop, or move up/down) be added later? It is **blocked** today: no `position`/`order` field exists on the entities or DTOs, and the API returns items ordered by id ascending only. Adding it requires a backend ordering field plus a reorder endpoint. v1 appends new items to the end and does not offer reordering.
2. **Lesson body and media before a richer learner player.** Should a lesson gain a body or content field (and the player gain real rendering) before broad rollout? Recommended eventually, but **blocked** until the backend exposes lesson body or media. v1 manages titles only, and the learner player already shows an honest "content not available" placeholder.
3. **Course status in the content response.** Should `InstructorCourseContentResponse` include the course `status` so the UI can pre-disable actions on archived courses? **Recommended.** It is the cheapest way to replace the reactive 409 handling (§11) with a clear, proactive disabled state. Until then, v1 handles 409 calmly and inline.
4. **"Manage content" entry point from `InstructorCoursesPage`.** Should each course row link to `/instructor/courses/{id}/content`? **Recommended** as a fast follow, so instructors reach this page from the list rather than by typing a URL. Not built in this task.
5. **Typed-confirmation deletes.** Should deleting a section (which destroys its lessons and learner progress) require typing the section title to confirm, rather than a single-click confirm? Defaulting to the single-click inline confirm for v1 (consistent with the existing archive pattern); revisit if accidental deletion becomes a real risk in QA.
6. **Instructor preview of the learner experience.** Should an instructor preview use the learner route or a dedicated preview route? The learner route is enrollment-gated and would 404 for a non-enrolled instructor, so it is not viable as-is. A separate instructor preview endpoint or a self-enroll-as-preview mechanism would be needed. Omitted from v1 (§5).
7. **Quiz builder attachment.** Should quiz authoring (the existing instructor quiz endpoints) attach to lessons or to sections, and should it live on this page or a separate surface? Out of scope for v1. Recommendation: keep quiz authoring on its own surface and decide the lesson-versus-section attachment when that surface is designed, so this page stays a focused section-and-lesson builder.
8. **Softer in-page handling of cross-instructor access.** Today a 403 (another instructor's course) redirects to `/unauthorized` via the global interceptor. Should this page instead show an in-page "not your course" state? That is an interceptor-level decision affecting the whole app, not a page-level override; left as-is for v1.

---

## Implementation Readiness Summary (for the next session)

- **Build now:** the full builder. Header with course title and the "Course content" fallback, summary strip, section list with inline add/rename/delete, lesson rows with inline rename/delete, side add-section panel, and all render states (loading, empty, course-not-found, generic error, plus inline 409 and 400 handling). Net-new files expected: `src/api/instructorCourseContent.ts` (types and the seven calls), optionally a `useInstructorCourseContent(courseId)` hook, the page under `src/features/instructor/pages/`, and one route entry under `/instructor` in `router/index.tsx`.
- **Reuse:** `Button` (including the `destructive` variant for delete confirms), `Input`/`FormField`, `StatePanel`, the `Bone` skeleton idiom, and `InstructorLayout` (inherited from the route parent). The inline-confirm and `aria-live` row patterns can be lifted from `InstructorCoursesPage`.
- **Blocked (needs backend contract first):** section/lesson reordering, lesson body/media, and proactive pre-disabling of actions on archived courses (needs `status` in the content response). All three are handled gracefully in v1: append-only ordering, no media slots, and calm reactive 409 handling.
