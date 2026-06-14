# Course Player Page — UI & Interaction Specification

> No-implementation spec. This document defines the learner-facing **course player** page: the focused workspace where an enrolled learner browses a course's sections and lessons and tracks completion. It is a documentation and design task only. Do not implement the React page from this document without a follow-up task.
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use in `LearnerDashboard.tsx`, `CourseCard.tsx`, `ProgressBar.tsx`, `StatePanel.tsx`, `Badge.tsx`, and `Button.tsx`. Where a role has no defined token, it is flagged as a design decision, not invented.

---

## 0. Scope & Assumptions

- This page is **learner-only through authenticated access**. There is no separate "learner" role gate in the route; any authenticated user reaches the route, and the **backend** decides what they may see.
- **Backend access control is enrollment-based**, verified in `LearnerCourseContentService.getCourseContentForLearner`:
  - **Not enrolled** in the course returns **404** (deliberate: a learner must not be able to probe course existence by id).
  - **Missing course** returns **404**.
  - **Cancelled enrollment** (`EnrollmentStatus.CANCELLED`) returns **404**.
  - **ACTIVE or COMPLETED enrollment** returns the content payload.
  - **Archived courses remain accessible** if the learner holds an ACTIVE or COMPLETED enrollment. The service inspects only the enrollment, never `course.status`, so archival does not revoke an enrolled learner's access. See §12 for the open question of whether to surface an "archived" notice (the content payload does not currently carry course status, so v1 cannot surface it without a contract change).
- The **first version focuses on course structure and progress**, not rich media playback. The backend does not return lesson body, video URL, content URL, duration, lesson type, attachments, or quiz counts, so this page does not render or imply any of those.
- The page consumes data the frontend does **not yet have a client for**. There is currently **no** `src/api/courseContent.ts` and **no** `useCourseContent` hook (verified: no frontend file references `learner/courses/{id}/content`). Both are net-new and are part of the follow-up implementation task, not this spec.

---

## 1. Route & Access

### Recommended route

```
/dashboard/courses/:courseId
```

This nests cleanly under the existing `/dashboard` `DashboardLayout` route in `frontend/src/router/index.tsx`. The current child `courses` (the `MyCoursesPage` index list) and a new `courses/:courseId` (this player) are siblings; React Router resolves the static `courses` list and the parameterized `courses/:courseId` detail without conflict. No existing route is displaced.

**Why inside the dashboard area:** the player is product UI for an enrolled learner. It belongs behind authentication, alongside My Courses and Progress, and should share the dashboard chrome (sidebar, topbar) so navigation continuity is preserved. It is **not** a public/marketing surface.

### Guard

Wrap in **`ProtectedRoute`** (inherited from the `/dashboard` parent, which is already wrapped). `ProtectedRoute` redirects unauthenticated users to `/login`. No additional guard is needed:

- We deliberately do **not** add an "enrolled-only" frontend guard. Enrollment is backend-owned and dynamic; the source of truth is the 404 from the content API. Gating in the client would duplicate authorization logic and could drift. The page handles the 404 as a first-class state (see §9).
- `InstructorRoute` / `AdminRoute` do not apply here.

### Should this page sit inside `DashboardLayout`?

**Yes.** It renders inside `DashboardLayout`'s `<main><Outlet /></main>`, exactly like `MyCoursesPage` and `ProgressPage`. This spec therefore covers **only the content column**, not page chrome. The layout owns the sidebar, topbar, and scroll container.

### Expected redirects (handled by existing infrastructure, do NOT reimplement)

| Condition | Handled by | Behavior |
|---|---|---|
| Unauthenticated | `ProtectedRoute` | Redirect to `/login` |
| 401 from any API call | Global Axios response interceptor (`setupApiInterceptors`) | `logout()` + redirect to `/login` |
| 403 from any API call | Global Axios response interceptor | Redirect to `/unauthorized`, no logout |

The page itself must **never** call `logout()` on 401 or navigate on 403. It only handles 404 and 500 in its own render states.

### Content API status-code behavior (page-local)

| Content API result | Page behavior |
|---|---|
| **404** (not enrolled / missing / cancelled) | Render the **404 state** (§9): "Course content is unavailable." Helper text plus a link back to `/dashboard/courses`. |
| **500** (or any non-401/403/404 failure) | Render the **generic error state** (§9): "We could not load this course." with a **Try again** action that re-runs the fetch. |
| **200, empty `sections`** | Render the **empty state** (§9): "No lessons available yet." |
| **200, with sections** | Render the player. |

> Distinguishing 404 from 500 requires inspecting the Axios error's `response.status`. Both 401 and 403 are intercepted globally and will not reach this page's catch handler.

### Future entry points (out of scope for this spec, noted for continuity)

Link to this route later from: My Courses cards (Continue / Start), the Progress page, and dashboard course CTAs. Those wiring changes belong to their own tasks.

---

## 2. Backend Contract

### Primary: course content

```
GET /api/v1/learner/courses/{courseId}/content
Auth: Authenticated (enrolled learner only; enrollment checked server-side)
```

**Response body** (verified against `CourseContentResponse`, `SectionContentResponse`, `LessonContentResponse`):

```jsonc
{
  "courseId": 12,
  "courseTitle": "Advanced React Patterns",
  "sections": [
    {
      "id": 100,
      "title": "Getting Started",
      "lessons": [
        {
          "id": 1001,
          "title": "Course Overview",
          "completed": true,
          "lastPositionSeconds": 42,
          "timeSpentSeconds": 180
        }
      ]
    }
  ]
}
```

**Exhaustive field list (do not assume any field not listed here exists):**

| Object | Field | Type | Notes |
|---|---|---|---|
| Course | `courseId` | number (Long) | |
| Course | `courseTitle` | string | Use as the page title. |
| Course | `sections` | array | May be empty. Ordered by section id ascending (`findByCourseIdOrderByIdAsc`). |
| Section | `id` | number (Long) | |
| Section | `title` | string | |
| Section | `lessons` | array | May be empty for a section. Ordered by lesson id ascending. |
| Lesson | `id` | number (Long) | |
| Lesson | `title` | string | |
| Lesson | `completed` | boolean | JSON key is `completed` (record component `boolean completed`). |
| Lesson | `lastPositionSeconds` | number \| null | `Integer`, nullable. `null` when no progress row exists yet. |
| Lesson | `timeSpentSeconds` | number \| null | `Integer`, nullable. `null` when no progress row exists yet. |

> **Fields that DO NOT exist** in any of these DTOs and must not be rendered or implied: lesson duration, video URL, content URL, lesson body/HTML, lesson type, attachments, quiz count, section description, course status, instructor name, category.

### Progress mutation

```
PATCH /api/v1/lessons/{lessonId}/progress
Auth: hasRole('LEARNER')
```

**Request body** (verified against `LessonProgressUpdateRequest`):

| Field | Type | Required | Notes |
|---|---|---|---|
| `isCompleted` | boolean | **Yes** (`@NotNull`) | JSON key is `isCompleted`. |
| `lastPositionSeconds` | number | No | Optional. |
| `timeSpentSeconds` | number | No | Optional. |

**Response body** (verified against `LessonProgressResponse`):

```jsonc
{
  "id": 555,
  "learnerProfileId": 7,
  "lessonId": 1001,
  "isCompleted": true,
  "lastPositionSeconds": 42,
  "timeSpentSeconds": 180,
  "updatedAt": "2026-06-13T10:15:00"
}
```

> **Naming asymmetry to verify at integration time (blocker-adjacent):** the **content** payload names the boolean `completed`, while the **progress request and response** name it `isCompleted`. The frontend client must map both correctly (read `lesson.completed` from content; send `{ isCompleted }` to the PATCH; read `isCompleted` from the PATCH response). Confirm the exact serialized JSON keys against a live response before wiring, because Jackson record-component naming for `boolean isCompleted` can differ from `boolean completed`.

### Course progress (optional for v1)

```
GET /api/v1/lessons/course/{courseId}/progress
Auth: hasRole('LEARNER')
```

**Response body** (verified against `CourseProgressResponse`): `{ courseId, totalLessons, completedLessons, progressPercentage, isFullyCompleted }`.

This endpoint is **useful but not required** for v1: the page can compute the same numbers locally from the `sections[].lessons[].completed` flags already present in the content payload, avoiding a second request and keeping the progress strip in sync with optimistic completion toggles (§8). Treat this endpoint as the authoritative recompute source **if** server-side progress logic ever diverges from a naive lesson count. v1 default: compute locally; this endpoint is an optional reconciliation call after a successful PATCH.

---

## 3. Course Player State Model

Frontend types mirror the backend DTOs exactly. No invented fields.

```ts
// src/api/courseContent.ts (net-new)
export type LessonContentResponse = {
  id: number;
  title: string;
  completed: boolean;
  lastPositionSeconds: number | null;
  timeSpentSeconds: number | null;
};

export type SectionContentResponse = {
  id: number;
  title: string;
  lessons: LessonContentResponse[];
};

export type CourseContentResponse = {
  courseId: number;
  courseTitle: string;
  sections: SectionContentResponse[];
};
```

### Local UI state (page component)

| State | Type | Purpose |
|---|---|---|
| `content` | `CourseContentResponse \| null` | Fetched payload. |
| `loading` | `boolean` | Initial fetch in flight. |
| `error` | `'none' \| 'notFound' \| 'generic'` | Drives 404 vs generic error states (§9). A plain boolean is insufficient because 404 and 500 render differently. |
| `selectedLessonId` | `number \| null` | The lesson shown in the content panel. Defaults to the first not-completed lesson, else the first lesson, else `null` (see §6). |
| `savingLessonId` | `number \| null` | Lesson whose progress PATCH is in flight; disables its action and shows a pending affordance. |
| `optimisticCompleted` | `Set<number>` or derived | Optimistic completion overlay; rolled back on PATCH failure (§8). Simplest implementation: mutate `content` immutably and snapshot for rollback. |

Derived (not stored): `totalLessons`, `completedLessons`, `progressPercentage` (§8), `flatLessonOrder` (sections flattened to a single ordered lesson list for Previous/Next, §6).

---

## 4. Layout & Structure

### Page shell

Use the canonical dashboard page shell, identical to `MyCoursesPage`/`ProgressPage`:

```html
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

No `Container` primitive (that is the marketing width primitive). No full-bleed marketing `<section>` bands.

### Top-to-bottom structure

1. **Back link** to My Courses (`/dashboard/courses`). Quiet text link with a left arrow, `text-body-sm text-text-secondary` hover `text-text-primary`. `mb-4`.
2. **Course header** (§5): course title (`h1`), one helper line, and a compact progress summary strip (not `Stat`).
3. **Player body**: a two-column grid on desktop.
   - **Main (left):** lesson content panel (§6).
   - **Sidebar (right):** course outline (§7).
4. **Loading / empty / error** states replace the body (§9).

### Desktop grid

```html
<div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
  <!-- main: lesson content panel -->
  <!-- aside: course outline -->
</div>
```

`minmax(0,1fr)` on the main column prevents long lesson titles from forcing overflow. The outline is a fixed `340px` rail on `lg`.

### Mobile behavior (decision)

**On mobile (`< lg`), the outline renders ABOVE the content panel, inside a collapsible `<details>` disclosure that is collapsed by default**, with a summary line reading the current position (for example, "Lessons · 3 of 12 complete").

Rationale: the learner's primary action on a small screen is reading/working the selected lesson, not scanning the full tree. A long always-expanded outline would push lesson content far below the fold. A collapsed disclosure keeps navigation one tap away without displacing content. On `lg+`, the outline is always visible in the right rail and the disclosure wrapper is not used (render the outline directly).

> The native `<details>`/`<summary>` element gives keyboard and screen-reader support for free and needs no JS open-state. If a styled toggle is preferred, it must keep `aria-expanded` and a real button. v1 recommendation: native `<details>` to minimize custom a11y surface.

### Wireframe (lg)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside DashboardLayout > main)
┌──────────────────────────────────────────────────────────────────────┐
│ ← Back to My Courses                          (text-body-sm, secondary)│
│                                                                        │
│ Advanced React Patterns                       (h1 · text-title / 600)  │
│ Continue learning where you left off.         (text-body-sm secondary) │
│ 5 of 12 lessons complete · 42%   ▰▰▰▰▱▱▱▱▱▱   (compact progress strip) │
│                                                                        │
│ grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]                          │
│ ┌───────────────────────────────────┐ ┌────────────────────────────┐  │
│ │ Lesson content panel              │ │ Course outline (aside)     │  │
│ │ ┌───────────────────────────────┐ │ │ Getting Started            │  │
│ │ │ Course Overview      ✓ Done   │ │ │  ✓ Course Overview  ‹sel›  │  │
│ │ │ Resumed at 0:42 · 3m spent    │ │ │    Setup Your Editor       │  │
│ │ │                               │ │ │ Core Concepts              │  │
│ │ │ Lesson content will appear    │ │ │    Components              │  │
│ │ │ here when lesson materials    │ │ │  ✓ Props and State         │  │
│ │ │ are available.                │ │ │    ...                     │  │
│ │ └───────────────────────────────┘ │ └────────────────────────────┘  │
│ │ [Mark as complete]   ‹ Prev  Next ›│                                  │
│ └───────────────────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### Responsive table

| Breakpoint | Shell | Columns | Outline placement |
|---|---|---|---|
| base (`< 1024px`) | `px-8 py-8 pb-14 max-w-container mx-auto` | single column | Outline above content in a collapsed `<details>` |
| `lg` (1024px+) | same | `lg:grid-cols-[minmax(0,1fr)_340px]`, `gap-4` | Outline in the right rail, always visible |

> Tightening horizontal padding on mobile (`px-4 sm:px-8`) is a reasonable refinement but is a design decision, not an existing token-backed pattern. v1 keeps a flat `px-8` to match the rest of the dashboard.

### Vertical rhythm

- Back link `mb-4`. Header block `mb-8`. Grid sections internally use `gap-4`.
- Inside the content panel and outline cards: `p-4` content padding, consistent with `CourseCard`.

---

## 5. Course Header

Renders above the grid. Three lines plus an optional progress strip.

| Element | Content | Typography | Weight | Color | Spacing |
|---|---|---|---|---|---|
| Back link | "← Back to My Courses" → `/dashboard/courses` | `text-body-sm` | 500 | `text-text-secondary` hover `text-text-primary` | `mb-4`, `gap-1`, focus ring `focus-visible:outline-salem` |
| H1 | `content.courseTitle` | `text-title` | `font-semibold` (600) | `text-text-primary` | header block `mb-8` |
| Helper | "Continue learning where you left off." | `text-body-sm` | 400 | `text-text-secondary` | `mt-1` |
| Progress strip | "5 of 12 lessons complete · 42%" + thin bar | see below | | | `mt-3` |

### Compact progress summary strip (NOT `Stat`)

A single inline line plus the shared `ProgressBar`, never the `Stat` primitive (its `text-headline`/`text-display` scale is a marketing hero metric and is the wrong scale here).

- Text: `text-body-sm text-text-secondary`. The completed count and percentage may use `font-semibold text-text-primary` for the numerals only (matching the dashboard summary-strip treatment).
- Bar: reuse `ProgressBar` (`h-1`, `bg-surface-elevated` track, `bg-salem` fill, `role="progressbar"` with `aria-valuenow/min/max` already built in). Give it a meaningful `label`, for example `"Course progress"`.
- When `totalLessons === 0`: show "0 of 0 lessons complete · 0%" and a 0%-width bar, consistent with the empty outline message (§9).

Do not show fabricated duration, rating, certificate promises, price, XP, streaks, or trophies.

---

## 6. Lesson Content Panel

Because the backend returns **no** lesson body, video, or media, v1 is deliberately honest: it shows lesson identity, completion, and the small amount of real progress data, plus a calm placeholder.

### Panel container

```html
<section className="bg-surface border border-border-default rounded-lg p-4">
```

No shadow at rest (Flat-At-Rest Rule).

### Contents for the selected lesson

1. **Lesson title** — `h2.text-title-sm font-semibold text-text-primary`.
2. **Completion state** — visible text plus icon, never color alone:
   - Completed: `Badge variant="anzac"` with a `Check` icon and the text "Done" (same composition as `CompletedCourseCard`).
   - Not completed: a neutral inline label "Not completed yet" in `text-caption text-text-muted`. Do not use a red/coral chip; incomplete is a neutral state, not an error.
3. **Resume / time detail** — only when present (non-null):
   - `lastPositionSeconds` → "Resumed at M:SS" (format seconds to `M:SS`).
   - `timeSpentSeconds` → "{n}m spent" (or "{s}s spent" under 60s).
   - When both are `null`, render nothing here (do not show "0:00" or "not started" noise). `text-caption text-text-secondary`.
4. **Placeholder panel** — a nested calm block on `bg-surface-elevated rounded-md p-6 text-center`:
   - Body: "Lesson content will appear here when lesson materials are available." `text-body-sm text-text-secondary`.
   - No spinner, no illustration, no faux video frame. This matches the calm tone of `StatePanel`.
5. **Actions row** (`mt-4`, `flex items-center justify-between gap-2`):
   - **Mark as complete** action (§8). Implementable in v1 because the PATCH contract is fully defined.
   - **Previous lesson** / **Next lesson** navigation (see below).

### Previous / Next navigation

Flatten all sections' lessons in order into a single `flatLessonOrder` array, then navigate by index relative to `selectedLessonId`.

- "Previous lesson" disabled (and `aria-disabled`) on the first lesson; "Next lesson" disabled on the last.
- These are low-weight controls: secondary `Button size="sm"` or quiet Salem text-links with arrow icons. Keep at most one Salem **primary** per zone (the Forest Rule), so if "Mark as complete" is a primary `Button`, Prev/Next are `secondary` or text-links.
- Accessible names must include direction and ideally the target title, for example `aria-label="Next lesson: Setup Your Editor"`.

### Default selected lesson

On load, select the **first lesson whose `completed === false`** (resume point). If all are complete, select the **first lesson**. If there are no lessons, render the empty state (§9) instead of the panel.

Do not invent a video player, transcript, notes, or lesson body.

---

## 7. Course Outline

Lists sections and their lessons. This is the navigation spine of the page.

### Section block

- Wrapper: `bg-surface border border-border-default rounded-lg p-4`, no shadow at rest.
- Section title: `h3.text-title-sm font-semibold text-text-primary mb-2`. (Heading level sits below the panel/page hierarchy; see §10 heading order.)
- Lesson list: a `<ul>` with one row per lesson.
- A section with no lessons shows a single muted line "No lessons in this section yet." (`text-caption text-text-muted`).

### Lesson row (selectable)

Each row is a **single** interactive `<button>` (no nested interactive elements):

```html
<button
  type="button"
  aria-current={isSelected ? 'true' : undefined}
  aria-label={`${lesson.title}${lesson.completed ? ', completed' : ''}`}
  className="w-full flex items-center gap-2 text-left rounded-md px-2 py-2 min-h-[44px]
             text-body-sm text-text-secondary
             hover:bg-surface-elevated hover:text-text-primary
             motion-safe:transition-colors duration-fast
             focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
>
```

| Sub-element | Treatment |
|---|---|
| Completion indicator | A `Check` icon **plus** screen-reader text. Completed: `Check` in `text-salem` with `aria-hidden`, and the visible/SR label carries ", completed" (status is never color-only). Not completed: an empty circle outline icon or a consistent spacer to keep alignment, with no "completed" text. |
| Lesson title | `text-body-sm`, `line-clamp-2` acceptable; selected row uses `text-text-primary font-medium`. |
| Selected state | `bg-salem-50 text-salem` tint on the row plus `aria-current="true"`. This mirrors the active-tab treatment in the My Courses filter group (`bg-salem-50 text-salem`). |

Clicking a row sets `selectedLessonId` and (on mobile) may close the `<details>` disclosure so the content panel comes into view.

### Outline tokens

- `bg-surface`, `border border-border-default`, `rounded-lg`, **no shadow at rest**.
- Hover lift is **not** used on outline rows; they intensify to `bg-surface-elevated` only (tonal, within the three-tier depth budget).
- Clear, visible focus states on every row.
- **No nested interactive elements.** The row is one button. Do not place a separate "mark complete" button inside the row in v1; completion is driven from the content panel (§6/§8). If row-level completion is added later, it must not nest a button inside a button (use a single control or a toolbar pattern).

---

## 8. Progress Behavior

The PATCH contract is fully specified, so **v1 includes a "Mark as complete" mutation.**

### Action: Mark as complete

Trigger: the "Mark as complete" control in the content panel (§6) for the selected lesson.

Request:

```
PATCH /api/v1/lessons/{selectedLessonId}/progress
body: { "isCompleted": true }
```

`lastPositionSeconds` and `timeSpentSeconds` are optional and are **omitted** in v1 (there is no media surface producing real values; sending fabricated numbers is forbidden).

Behavior:

1. Set `savingLessonId = lesson.id`; disable the control and show a pending affordance (the `Button` `loading` prop is built for this).
2. **Optimistic update**: immediately set the lesson's `completed` to `true` in local `content`, recompute the progress strip.
3. On **success** (200): keep the optimistic state. Optionally read `isCompleted` from the response to reconcile. Clear `savingLessonId`.
4. On **failure**: **roll back** the optimistic change to the prior snapshot, clear `savingLessonId`, and surface a calm inline message near the action ("Could not update progress. Try again."). Do not navigate, do not toast aggressively, do not call `logout()` (401/403 are interceptor-owned).

### Manual toggle (un-complete)

Whether a learner may toggle a completed lesson back to incomplete is an **open decision** (§12). v1 default: **complete is one-way** in the UI (show "Done" with no un-complete control), because there is no product requirement yet for reverting and it avoids accidental progress loss. The endpoint technically accepts `isCompleted: false`, so this can be enabled later without a contract change.

### Progress calculation

Compute locally from the content payload:

- `totalLessons` = count of all lessons across all sections.
- `completedLessons` = count of lessons where `completed === true`.
- `progressPercentage` = `totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100)`.
- If `totalLessons === 0`: show 0% and the empty outline message (§9). Never divide by zero.

Optional reconciliation: after a successful PATCH, the page **may** call `GET /api/v1/lessons/course/{courseId}/progress` and adopt its `progressPercentage`/`completedLessons` if server logic differs from the naive count. v1 default is the local computation; the GET is a future hardening step, not required.

---

## 9. Loading, Empty, and Error States

All states render inside the page shell, replacing the grid body (the header may still render once `content` is known; during initial load use skeletons for everything).

### Loading

Skeleton blocks (no spinner), matching the real layout:

- Header: a title-width bar and a shorter helper bar.
- Grid: a tall content-panel skeleton (left) and an outline skeleton of stacked rows (right).

Reuse the existing dashboard skeleton conventions (neutral `bg-surface-elevated` blocks with `rounded`); do not introduce a new spinner.

### Empty (200 with no lessons)

Use `StatePanel`:

- Title: **"No lessons available yet"**
- Body: **"This course does not have published lessons yet."**

(If `sections` exist but every section has empty `lessons`, treat as empty overall.)

### Error — generic (500 / unknown)

Use `StatePanel` with `onRetry`:

- Body: **"We could not load this course."**
- Action: **"Try again"** (re-runs the fetch; `StatePanel` already renders this when `onRetry` is passed).

### Error — 404 (not enrolled / missing / cancelled)

Use `StatePanel` (no retry; retrying a 404 is pointless):

- Title: **"Course content is unavailable."**
- Body helper: **"This course may not exist, or you may not be enrolled."**
- Provide a link back to **`/dashboard/courses`** (quiet Salem text-link, same treatment as the header back link).

> Do not manually `logout()` on 401 or redirect on 403. The global Axios interceptor owns both. This page only renders 404, generic-error, empty, and loading states.

---

## 10. Accessibility

- **Heading order**: `h1` = course title (header). `h2` = lesson content panel title. `h3` = section titles in the outline. No skipped levels; one `h1` per page.
- **Outline rows**: each is a `<button>` with a clear accessible name including the lesson title and, when applicable, ", completed". Selected row uses `aria-current="true"` (`aria-current` is the correct semantic for "the current item within a set").
- **Completion status is visible text, not color alone**: the `Check` icon is paired with text ("Done" badge in the panel; ", completed" in the row's accessible name). Color (`text-salem`) is reinforcement only.
- **Progress bar**: reuse `ProgressBar`, which already exposes `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`, and an `aria-label`. Pass a descriptive label.
- **Previous / Next buttons**: accessible names include direction and target ("Previous lesson", "Next lesson", ideally with the title). Disabled at the ends use `disabled` + `aria-disabled`.
- **Focus states**: every interactive element shows the standard ring `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`. Minimum touch target `min-h-[44px]`.
- **Keyboard navigation**: the outline is natively tabbable (real buttons); the mobile disclosure is a native `<details>`/`<summary>` (keyboard-operable by default). Tab order follows DOM order: back link → header controls → content panel actions → outline rows.
- **No nested buttons/links**: rows are single buttons; the back link and the 404 "back" link are standalone anchors/links.
- **Motion**: transitions use `motion-safe:` prefixes (consistent with `CourseCard`/`StatePanel`) so reduced-motion users are respected.

---

## 11. Design-Rule Compliance Notes

- **Product learning workspace, not marketing/catalog.** Uses the dashboard shell (`px-8 py-8 pb-14 max-w-container mx-auto`) inside `DashboardLayout`. Deliberately avoids `Container`, `SectionHeader`, and `Stat` (the marketing primitives).
- **No catalog/marketing pattern reuse.** No public course cards, no hero band, no price/rating/discount language, no gradient text, no glassmorphism, no large Salem backgrounds.
- **No fake content.** No invented video player, lesson body, duration, ratings, or certificate promises. The placeholder panel states honestly that materials are not yet available.
- **No large metric cards.** Progress is a compact `text-body-sm` strip plus a thin `ProgressBar`, never a `Stat` hero number.
- **No gamification.** No XP, streaks, leaderboards, levels, or points.
- **No trophy-heavy completion visuals.** Completion is a quiet `Badge variant="anzac"` ("Done") and a `Check` icon, consistent with the existing completed-course treatment. No confetti, no trophies.
- **No shadows at rest.** Panels and outline cards are flat (`bg-surface border border-border-default rounded-lg`). Tonal hover only (`bg-surface-elevated`); the hover-lift shadow used on in-progress catalog/dashboard thumbnails is **not** used here.
- **Salem for focused actions only.** Salem appears as: the `ProgressBar` fill (sanctioned progress role), the selected-lesson tint (`bg-salem-50 text-salem`), the single primary action ("Mark as complete"), and focus rings. Large surfaces stay `bg-bg-base` / `bg-surface`. The Forest Rule (one primary per zone) is respected: at most one Salem primary button in the content panel.
- **Three-tier depth max.** `bg-bg-base` (page) > `bg-surface` (panels/cards) > `bg-surface-elevated` (placeholder block, hover, selected tints). No deeper nesting.
- **Single typeface, restrained scale.** Inter only: `text-title` (h1) → `text-title-sm` (panel/section h2/h3) → `text-body-sm` (rows/body) → `text-caption` (meta). No in-between sizes.

---

## 12. Open Decisions

| # | Decision | v1 recommendation | Notes / blocker |
|---|---|---|---|
| 1 | Exact route: `/dashboard/courses/:courseId` vs another | **`/dashboard/courses/:courseId`** | Clean sibling of the existing `courses` index; no conflict in `router/index.tsx`. |
| 2 | Should a lesson content/body endpoint exist before full player implementation | **Yes, eventually** | v1 ships the structure-and-progress player honestly with a placeholder. Rich playback is **blocked** until the backend exposes lesson body/media (no such field exists today). |
| 3 | Use `PATCH /lessons/{lessonId}/progress` in v1 | **Yes** | Contract is fully defined (`isCompleted` required). "Mark as complete" is buildable now. |
| 4 | Can completed lessons be manually toggled (un-completed) | **No in v1 (one-way)** | Endpoint accepts `isCompleted:false`; can be enabled later with no contract change. Product decision. |
| 5 | Include quizzes in the player now or later | **Later** | Quiz authoring exists for instructors, but there is no learner quiz-taking/attempt endpoint and the content payload carries no quiz data. **Blocked** for the player until a learner-facing quiz contract exists. |
| 6 | Must the instructor lesson builder come before the learner player | **Recommended before broad rollout** | The player can render whatever lessons exist, but without an instructor lesson-builder UI, real courses will have empty `sections`/`lessons`, so the empty state will dominate in practice. Sequencing decision, not a hard blocker for building the player shell. |
| 7 | Surface archived-course access with a notice for enrolled learners | **Not in v1** | Enrolled learners retain access (enrollment-based gate). **Blocked** from showing an "archived" banner because the content payload does not include `course.status`. Would require a backend contract addition. |
| 8 | Optional second progress fetch (`GET /lessons/course/{courseId}/progress`) | **Skip in v1; compute locally** | Use only if server progress logic later diverges from a naive lesson count. |
| 9 | JSON key naming (`completed` vs `isCompleted`) | **Verify against a live response before wiring** | Content uses `completed`; progress request/response uses `isCompleted`. Confirm serialized keys to avoid a silent mapping bug. |

---

## Implementation Readiness Summary (for the next session)

- **Build now:** the player shell, header + compact progress strip, content panel with placeholder, "Mark as complete" (optimistic + rollback), course outline with selectable rows, Prev/Next, and all four render states (loading/empty/404/generic). Net-new files expected: `src/api/courseContent.ts`, a `useCourseContent(courseId)` hook, the page under `src/features/dashboard/pages/`, and a route entry in `router/index.tsx`.
- **Reuse:** `ProgressBar`, `Badge` (`anzac`), `Button`, `StatePanel`, and the dashboard shell/header conventions.
- **Blocked (needs backend contract first):** rich lesson playback/body, learner quizzes, and any archived-status notice.
