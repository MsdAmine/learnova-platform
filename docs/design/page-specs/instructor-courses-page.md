# Instructor Courses Page UI Layout Specification

## 0. Scope & Assumptions

This is a no-implementation UI and interaction specification for the **instructor course management page**: the first instructor-facing product surface in Learnova. It is the workspace where an approved instructor sees the courses they own, creates new ones, and moves them through their lifecycle (draft, published, archived).

**This is product UI, not marketing UI.** It is not a public catalog, not a marketplace, and not a metrics dashboard. It must feel like a calm professional workspace, continuous with the learner dashboard, not with the landing page.

**In scope for v1:**

- Listing the courses owned by the authenticated instructor.
- Showing each course's lifecycle status clearly (Draft / Published / Archived).
- Triggering lifecycle actions (publish, archive) against the existing backend endpoints.
- Triggering create and edit flows against the existing create/patch endpoints (the flows themselves are specified here but the forms are not implemented in this task).
- Local (client-side) status filtering over the fetched list.
- Loading, empty, filtered-empty, and error states.

**Out of scope for v1 (do not build, do not imply in the UI):**

- Lessons, sections, and the course content builder.
- Quiz, question, and answer-option authoring (separate instructor endpoints exist but are a different surface).
- A course detail or course editor page beyond the create/edit form for the four core fields.
- Media or thumbnail upload (the backend accepts a `thumbnailUrl` string only; there is no upload endpoint).
- Analytics, enrollment counts, revenue, ratings, or any learner-facing metric.
- Server-side search, filtering, sorting, or pagination (no such parameters exist on the backend).

**Access assumption.** This page is **instructor-only** and must sit behind `InstructorRoute`. `InstructorRoute` already exists (`frontend/src/components/common/InstructorRoute.tsx`) and checks `isAuthenticated` plus `user.availableProfiles.includes('INSTRUCTOR')`, redirecting unauthenticated users to `/login` and authenticated-but-not-instructor users to `/unauthorized`. The backend `availableProfiles` remains the single source of truth for instructor access. Do not infer instructor access from `activeProfile` alone or from stale localStorage.

**Hard blocker, stated up front (see §2 and §12).** There is **no instructor course list endpoint**. `CourseController` exposes only create, patch, publish, and archive. `CourseService` can list published courses (public catalog) and a learner's wishlist, but has no method returning the authenticated instructor's own courses across all statuses. Until a backend list endpoint exists, this page cannot be implemented against real data. It can be built against temporary mock data for layout review only, or implementation should wait for the backend endpoint. This spec defines the page as if the list endpoint exists so that no layout work is lost once it does.

## 1. Route & Access

**Recommended route: `/instructor/courses`.**

Register it as a child of the pathless `RootLayout` in `src/router/index.tsx`, as a sibling of `/dashboard`, wrapped in `InstructorRoute`. It is **not** a child of the learner `/dashboard` tree, because the learner dashboard sidebar is learner-only (its "My Courses" item points at `/dashboard/courses`, the learner's enrolled courses). Nesting an instructor surface under the learner shell would conflate the two roles.

```tsx
// Conceptual placement in src/router/index.tsx (do not implement in this task)
{
  path: '/instructor/courses',
  element: (
    <InstructorRoute>
      <Suspense fallback={<DashboardPageSkeleton />}>
        <InstructorCoursesPage />
      </Suspense>
    </InstructorRoute>
  ),
}
```

**Guard: `InstructorRoute`.** Redirect behavior is already owned by the guard:

- Not authenticated, redirect to `/login`.
- Authenticated but `availableProfiles` does not include `'INSTRUCTOR'`, redirect to `/unauthorized`.

Do not duplicate this authorization logic inside the page. The page may assume that if it renders, the viewer is an approved instructor.

**Navigation placement.** This page should live in a **separate instructor area**, not as a new item in the learner dashboard sidebar. The learner `DashboardLayout` sidebar (`NAV_ITEMS` in `frontend/src/features/dashboard/components/DashboardLayout.tsx`) is a fixed learner list (Dashboard, My Courses, Progress, Certificates, Live Sessions, Settings). Adding "Teaching" items there would make a single sidebar serve two roles and blur the learner/instructor boundary that the dual-profile model keeps deliberately distinct. How the instructor area is shelled is an open decision (§12); the layout default for v1 is in §4.

**Role / profile assumptions.**

- The viewer is an instructor whose `availableProfiles` includes `'INSTRUCTOR'`.
- The backend is the source of truth for that. Re-fetching `/api/v1/auth/me` via `useCurrentUser` on app load keeps `availableProfiles` fresh; this page relies on the guard, not on its own role inference.
- The page does not read `activeProfile` to decide access. `activeProfile` may drive which shell/nav is shown (open decision §12), but never whether the instructor data loads.

## 2. Backend Contract

All paths below are verified in `CourseController.java` and `CourseService.java`.

| Method | Path | Purpose | Auth | Verified |
|---|---|---|---|---|
| POST | `/api/v1/instructor/courses` | Create a course (always created as `DRAFT`) | `INSTRUCTOR` | Yes |
| PATCH | `/api/v1/instructor/courses/{courseId}` | Update core fields of a non-archived course | `INSTRUCTOR` | Yes |
| POST | `/api/v1/instructor/courses/{courseId}/publish` | Move `DRAFT` to `PUBLISHED` | `INSTRUCTOR` | Yes |
| POST | `/api/v1/instructor/courses/{courseId}/archive` | Move `DRAFT`/`PUBLISHED` to `ARCHIVED` | `INSTRUCTOR` | Yes |

**Create returns `CourseResponse` with HTTP 201.** Patch, publish, and archive return `CourseResponse` with HTTP 200.

**Category dependency.** The create and edit forms need a category selector. `GET /api/v1/categories` exists and is public (it appears in the project API surface and `CategoryController`). The create payload requires a `categoryId`, so the form depends on that categories endpoint. There is no frontend categories client yet (CURRENT_STATE.md lists "categories" under missing API clients), so one must be added when the form is implemented.

**Backend gap, restated as a blocker.** There is **no `GET /api/v1/instructor/courses`** (or any equivalent) that returns the courses owned by the authenticated instructor. Verified by reading `CourseController` (no GET mapping) and `CourseService` (only `listPublishedCourses()` for the public catalog and `getLearnerWishlist()` for learners). Consequences:

- The list at the center of this page **has no data source today.**
- Reusing the public catalog `GET /api/v1/courses` is wrong: it returns only `PUBLISHED` courses and is not scoped to the current instructor, so it would hide the instructor's own drafts and archived courses, which are the whole point of this page.
- Until a backend list endpoint ships, this page can only be built against temporary mock data for layout/visual review. Real-data implementation is **blocked** and should not be attempted.

Recommended backend addition (for §12, not part of this task): a `GET /api/v1/instructor/courses` returning `List<CourseResponse>` scoped to the authenticated instructor's `InstructorProfile`, across all statuses, so the page can render drafts, published, and archived courses the instructor owns.

## 3. Instructor Course State Model

The UI item model mirrors the real `CourseResponse` DTO field for field. `Instant` serializes to an ISO string. Do not invent fields.

```ts
// Mirrors backend CourseStatus enum.
type InstructorCourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// Mirrors backend CourseLevel enum.
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

// Mirrors backend CourseResponse field for field.
type InstructorCourseItem = {
  id: number;
  title: string;
  description: string | null;
  level: CourseLevel;
  status: InstructorCourseStatus;
  thumbnailUrl: string | null;
  categoryId: number;
  categoryName: string;
  instructorProfileId: number;
  instructorName: string;
  createdAt: string;   // ISO instant
  updatedAt: string;   // ISO instant
};
```

**Display labels (never render the raw enum string):**

- Status: `DRAFT` renders "Draft", `PUBLISHED` renders "Published", `ARCHIVED` renders "Archived". Note the `Badge` primitive renders text uppercase with letter-spacing, so on screen these read "DRAFT", "PUBLISHED", "ARCHIVED" inside a badge.
- Level: `BEGINNER` renders "Beginner", `INTERMEDIATE` renders "Intermediate", `ADVANCED` renders "Advanced", `ALL_LEVELS` renders "All levels".

**Public visibility derives from status, it is not a separate field.** Only `PUBLISHED` courses appear in the public catalog and accept enrollment (verified: `listPublishedCourses()` filters to `PUBLISHED`; enrollment blocks non-published). The UI states public visibility as derived text: Published is "Visible in catalog", Draft and Archived are "Not visible in catalog". Do not fabricate an `isPublic` field.

**Page-level states** (mutually exclusive):

| State | Condition | Renders |
|---|---|---|
| Loading | list fetch in flight | skeleton rows (§9) |
| Loaded | fetch resolved, list non-empty | summary strip + filter toolbar + course list |
| Empty | fetch resolved, instructor owns zero courses | first-course empty panel (§9) |
| Filtered-empty | list non-empty, active filter matches nothing | toolbar stays, inline empty line (§9) |
| Error | fetch rejected | error panel with "Try again" (§9) |

## 4. Layout & Structure

**Page shell (v1 default).** Reuse the canonical dashboard product page shell so the instructor surface stays visually continuous with the rest of the app:

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

This is the identical shell used by `MyCoursesPage` and the other dashboard pages. Do **not** use the marketing `Container` primitive and do not use full-width marketing `<section>` bands.

**Surrounding chrome (open decision §12, with a v1 default).** Whether this page sits inside the learner `DashboardLayout`, inside a new `InstructorDashboardLayout`, or renders standalone is an open decision. The v1 default that does **not** confuse learner and instructor navigation: render the page inside a **lightweight instructor shell** that reuses the dashboard topbar pattern (logo, notifications, profile chip) but presents instructor-appropriate navigation, rather than the learner sidebar `NAV_ITEMS`. If a separate shell is too much for the first slice, the acceptable fallback is to render the page standalone using the shell `<div>` above with a back link to the learner dashboard, and to introduce `InstructorDashboardLayout` as a fast follow. Either way, the learner sidebar must not gain instructor items.

Top-to-bottom content structure inside the shell:

1. **Page header row** — title and subtitle on the left, a single primary "Create course" action on the right.
2. **Status summary strip** — a compact, inline, dot-separated count line. Not the `Stat` primitive.
3. **Filter toolbar** — `FilterTabs` for All / Draft / Published / Archived.
4. **Course list** — one row per owned course (§6). A vertical list of full-width rows, not a public-catalog card grid.
5. **Empty / filtered-empty / error states** — per §9.

### Header

- **H1**: "My teaching courses" — `text-title font-semibold text-text-primary`.
- **Subtitle**: "Create, publish, and manage the courses you teach." — `text-body-sm text-text-secondary mt-1`.
- **Primary action**: a single `Button variant="primary" size="md"` labeled "Create course", right-aligned on the header row at `md+`, stacking below the title block on mobile. This is the one primary button on the page (Forest Rule); per-row actions are lower weight.

Header row layout: `flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8`.

### Status summary strip

A single inline line beneath the header, `text-body-sm text-text-secondary mb-8`, dot-separated, with the count value emphasized `font-semibold text-text-primary`:

```
8 courses · 3 published · 4 drafts · 1 archived
```

This mirrors the learner dashboard summary strip idiom. It is **not** `Stat` and not a hero-metric grid. Counts are computed client-side from the fetched list. Omit zero-value segments to keep the line quiet (for example, drop "0 archived").

### Content-column wireframe (lg)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside instructor shell)
┌──────────────────────────────────────────────────────────────────────────┐
│ My teaching courses                          [ Create course ]  (primary)  │
│ Create, publish, and manage the courses you teach.                         │
│                                                                            │
│ 8 courses · 3 published · 4 drafts · 1 archived   (summary strip)          │
│                                                                            │
│ [ All ][ Draft ][ Published ][ Archived ]            (FilterTabs)          │
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ React Fundamentals                              [DRAFT]              │   │
│ │ Development · Beginner · Not visible in catalog · Updated 2 days ago │   │
│ │                                   [ Publish ]  [ Edit ]  [ Archive ] │   │
│ └────────────────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ Spring Boot Masterclass                         [PUBLISHED]         │   │
│ │ Development · Advanced · Visible in catalog · Updated 5 days ago     │   │
│ │                                   [ Edit ]  [ Archive ]  View in catalog│ │
│ └────────────────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────────────────┐   │
│ │ Legacy jQuery Course                            [ARCHIVED]          │   │
│ │ Development · Intermediate · Not visible in catalog · Updated 1 mo ago │ │
│ │                                                       (no actions)    │   │
│ └────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Responsive behavior

| Breakpoint | Shell max-width | Header row | Course rows | Notable |
|---|---|---|---|---|
| base (< 640px) | `max-w-container` | title block then "Create course" full-width below | rows stack their action buttons below the meta line | filter tabs scroll horizontally if needed |
| `sm` (640px) | `max-w-container` | same | row actions sit inline, right-aligned | |
| `md` (768px+) | `max-w-container` | title left, "Create course" right (`justify-between`) | full row layout: title + badge top, meta + actions below | |

Horizontal padding stays a flat `px-8` to match the established shells. Tightening on mobile (`px-4 sm:px-8`) is the same open refinement flagged in the My Courses and catalog specs; do not decide it here.

### Vertical rhythm

- Header row: `mb-8`. Summary strip: `mb-8`. Filter toolbar: `mb-4` to `mb-6` before the list.
- Course rows: `gap-3` between rows in the list (`flex flex-col gap-3` or `space-y-3`).
- Inside a row: `p-4`; title to meta `mb-1`; meta to action row `mb-3` (when actions wrap below at mobile).

## 5. Filters

Use the existing `FilterTabs` component (`frontend/src/components/ui/FilterTabs.tsx`), which already renders `role="group"` with `aria-pressed` per tab and the Salem-tinted selected state.

**Options (in order):**

- All
- Draft
- Published
- Archived

**Behavior:**

- Purely **local** filtering over the already-fetched list. There is no server-side filtering on the instructor list endpoint (which itself does not yet exist), so the UI must not imply server refinement.
- Default selected tab is "All".
- The summary strip counts reflect the full list, not the filtered subset, so the instructor always sees the totals regardless of the active filter.
- Group `aria-label`: "Filter courses by status".

## 6. Course Row Specification

Prefer a **list of full-width rows**, not public-catalog cards. The public catalog card (`CourseCatalogCard`) is a decision-making surface for learners (thumbnail, description, enroll CTA). This is a management surface for the owner: status, lifecycle, and quick actions matter more than visual merchandising. Share tokens, not the catalog card component.

**Each row shows:**

- **Title** — `text-body-sm font-semibold text-text-primary`, `line-clamp-1`.
- **Status badge** — the `Badge` primitive, text-labeled (§3). Status is communicated by the badge *text*, never by color alone.
- **Category name** — `categoryName`, plain `text-caption text-text-secondary`.
- **Level** — display label (§3), plain `text-caption text-text-muted`.
- **Public visibility** — derived text: "Visible in catalog" for Published, "Not visible in catalog" for Draft and Archived. `text-caption text-text-muted`.
- **Updated date** — "Updated {relative or short date}", from `updatedAt`, `text-caption text-text-muted`. If a date utility is not yet shared, render a short absolute date; do not invent a new format token.
- **Actions** — per §7, right-aligned on the row at `sm+`, wrapping below the meta line on mobile.

Meta items sit on one quiet row, dot-separated, in the row's secondary/muted ink:

```
Development · Beginner · Not visible in catalog · Updated 2 days ago
```

**Row surface tokens:**

| Property | Token |
|---|---|
| Background | `bg-surface` |
| Border | `border border-border-default` |
| Radius | `rounded-lg` |
| Padding | `p-4` |
| Shadow at rest | none (Flat-At-Rest Rule) |
| Hover | none in v1, because the row itself is not a single clickable target (it contains multiple action buttons). If a later detail/editor route makes the row's title a link, `hover:border-border-hover` with `transition-colors duration-fast` may be added to the title affordance only, never a shadow lift. |

**Status badge mapping** (text is the message; the tint is reinforcement only):

| Status | Badge variant | Rendered text | Rationale |
|---|---|---|---|
| `PUBLISHED` | `salem` | PUBLISHED | Salem is the active/live meaning, reserved and earned here. |
| `DRAFT` | `default` | DRAFT | Neutral surface tint; work in progress, not live. |
| `ARCHIVED` | `default` | ARCHIVED | Neutral tint; the distinct text "ARCHIVED" (not "DRAFT") carries the difference, satisfying the no-color-alone rule. |

Do not use `coral` (warning) or `anzac` (achievement) for status: archiving is not a warning and publishing is not an achievement. `azure` is reserved for analytics/data context and does not apply here.

## 7. Lifecycle Action Behavior

Actions are derived strictly from the verified backend lifecycle in `CourseService` (publish: DRAFT to PUBLISHED, PUBLISHED idempotent, ARCHIVED returns 409; archive: DRAFT/PUBLISHED to ARCHIVED, ARCHIVED idempotent; update blocked with 409 on ARCHIVED).

To respect the Forest Rule (one primary per zone) the page's single primary button is "Create course" in the header. Per-row actions are therefore **secondary and ghost weight**, never a grid of primary Salem buttons.

**For `DRAFT` rows:**

- **Publish** — the most prominent row action, `Button variant="secondary" size="sm"`. Calls `POST /api/v1/instructor/courses/{id}/publish`. Shown only for Draft.
- **Edit** — `Button variant="ghost" size="sm"`. Opens the edit flow (§8). Allowed (update works for non-archived).
- **Archive** — `Button variant="ghost" size="sm"`. Calls `POST /api/v1/instructor/courses/{id}/archive`. Allowed for Draft.

**For `PUBLISHED` rows:**

- Do **not** repeat a primary-weight publish on every published row (publish on an already-published course is a no-op idempotent call and would create too many emphasized buttons).
- **Edit** — `Button variant="ghost" size="sm"`. Allowed (update works for non-archived). See §12 open decision on whether published courses should be directly editable or follow an unpublish/edit/publish flow; backend currently allows direct patch of a published course.
- **Archive** — `Button variant="ghost" size="sm"` or `secondary`. Allowed for Published.
- **View in catalog** (optional) — a Salem text-link to the public course, only meaningful once a public course detail route exists. Until `/courses/{id}` ships, omit it or point it at `/courses`. Mark as dependent on the detail route (§12).

**For `ARCHIVED` rows:**

- Show the Archived status badge and the meta line.
- **No "Publish again" action.** Verified: publishing an archived course returns 409 ("Archived courses cannot be published. Create a new course instead."). Showing a publish action that always fails would be a defect.
- **No Edit action.** Verified: `updateCourse` returns 409 on archived ("Archived courses cannot be updated"). Archived courses are read-only.
- **No enroll or public-catalog action** (archived courses are not in the catalog).
- The row is effectively terminal in v1: status visible, no lifecycle actions. Whether archived courses become restorable later is an open decision (§12); do not build restore in v1 because no backend path supports it.

**Action summary:**

| Status | Publish | Edit | Archive | View in catalog |
|---|---|---|---|---|
| DRAFT | Yes (most prominent) | Yes | Yes | No |
| PUBLISHED | No | Yes | Yes | Optional, route-dependent |
| ARCHIVED | No (409) | No (409) | No (idempotent no-op, hidden) | No |

**Interaction details:**

- While a lifecycle request is in flight, use the `Button` `loading` state (spinner, disabled, `aria-busy`) on the specific button pressed. Do not block the whole list.
- On success, the backend returns the updated `CourseResponse`. Update that row in place from the response (status flips, `updatedAt` refreshes, summary strip recounts). Do not navigate away.
- Confirmation: archiving is a meaningful, hard-to-reverse action (no restore path exists). Surface a lightweight confirm step before calling archive (a confirm affordance, not a heavy modal system). Publishing does not need confirmation.

## 8. Create / Edit Behavior

The create (`POST`) and patch (`PATCH`) endpoints exist and are verified. This section defines the flow; **do not implement the form in this task.**

**Form presentation.** Modal versus dedicated route is an open decision (§12). The v1 recommendation is a **dedicated route** (for example `/instructor/courses/new` and `/instructor/courses/{id}/edit`, both behind `InstructorRoute`) rather than a modal, because the create payload has a required category that depends on a separate fetch, and a route avoids cramming an async-dependent form into a modal. If the team prefers a modal for speed, it must still own its own loading/error states for the categories fetch.

**Fields, matching the backend request DTOs exactly:**

Create (`CourseRequest`, all constraints verified):

| Field | Required | Constraint | Control |
|---|---|---|---|
| `title` | Yes | non-blank, max 200 chars | `Input` (text) |
| `description` | No | max 2000 chars | textarea styled with Input tokens |
| `categoryId` | Yes | must be an existing category | select populated from `GET /api/v1/categories` |
| `level` | Yes | one of the `CourseLevel` enum values | select with the four display labels (§3) |
| `thumbnailUrl` | No | max 500 chars | `Input` (URL). Plain string only; there is no upload endpoint. |

Edit (`CourseUpdateRequest`): the same five fields, **all optional** (partial update). Send only changed fields. Editing is disallowed for archived courses (§7); do not present an edit form for an archived course.

**Status is never in the create/edit form.** Status is controlled exclusively by the publish and archive lifecycle buttons (§7). New courses are always created as `DRAFT` by the backend; the form must not offer a status field.

**Dependency.** The category selector depends on `GET /api/v1/categories`. No frontend categories client exists yet, so one must be added when the form is implemented. The form's own loading and error handling for that fetch is part of the form work, not this list page.

**Validation.** Mirror the backend constraints client-side for fast feedback (title required and max 200, description max 2000, thumbnailUrl max 500, category and level required on create), but treat the backend as authoritative. A 409 on create means a duplicate title for this instructor ("You already have a course with this title"); surface it as an inline field-level message, calm, not a red panel.

## 9. Loading, Empty, and Error States

**Loading.** A skeleton list in the established `Bone` idiom (matching `DashboardPageSkeleton`): a header bone pair (`h-7 w-48`, then `h-4 w-64`), a short toolbar bone, then four to six row skeletons, each `rounded-lg border border-border-default bg-surface p-4` containing a title bone, a meta bone, and a trailing action bone. Wrapper is `aria-hidden="true"`. No spinner at page level; spinners are reserved for in-button loading.

**Empty (instructor owns zero courses).** A calm bordered panel (the `StatePanel` idiom) spanning the content column:

- Title line: "No teaching courses yet" — `text-body-sm font-medium text-text-primary`.
- Body: "Create your first course to start building your catalog." — `text-body-sm text-text-secondary`.
- Action: a single "Create course" `Button variant="primary" size="md"` (this empty-state action and the header action are the same intent; only one primary is visible at a time because the list is absent here).

**Filtered-empty (a status filter matches nothing).** Keep the toolbar mounted so the instructor can switch filters. Below it, one centered line: "No courses match this filter." in `text-body-sm text-text-muted py-10 text-center`. No panel, no border, mirroring the My Courses filter-empty pattern.

**Error (list fetch failed).** A `StatePanel` with message "We could not load your teaching courses." and a "Try again" action wired to re-fetch. Calm bordered panel, secondary ink, no red, no illustration.

**Lifecycle action errors** (inline, per row, never a page-level red banner):

- **Publish 409** (archived course, should not occur because the action is hidden for archived, but handle defensively): inline `text-caption` line, calm, "Archived courses cannot be published again."
- **Archive failure**: inline `text-caption` line, "Could not archive this course. Try again." The button returns to idle.
- **Edit 409** (archived or duplicate title): handled in the form (§8), not on the list row.
- **404** (course deleted or not found between load and action): inline line "This course is no longer available." and disable the row's actions; a list re-fetch is acceptable but not required.
- **401 / 403**: do not handle manually. The shared Axios response interceptor already owns these (401 logout and `/login`, 403 `/unauthorized`). Do not duplicate that logic here.

## 10. Accessibility

- **Semantic heading order**: the page H1 is "My teaching courses". If a grouping heading is introduced above the list it is an `h2`. Do not skip levels.
- **Course-specific action labels**: every lifecycle button carries an `aria-label` naming its course, because a list of buttons all labeled "Publish" or "Archive" fails screen-reader users. Examples: `aria-label="Publish React Fundamentals"`, `aria-label="Archive Spring Boot Masterclass"`, `aria-label="Edit React Fundamentals"`.
- **Status as text**: status is conveyed by visible badge text ("DRAFT" / "PUBLISHED" / "ARCHIVED"), never by color alone (PRODUCT.md and the Field Rule). Public visibility is also explicit text.
- **Unavailable actions**: archived rows simply omit publish and edit rather than showing disabled controls. If any disabled control is ever shown, pair it with helper text explaining why (for example "Archived courses cannot be edited").
- **Focus states**: the shared primitives ship `focus-visible` Salem outlines; do not strip them. All interactive controls keep the established `min-h-[44px]` hit area used across the dashboard.
- **No nested interactive elements**: the row is not itself a button or link wrapping the action buttons. Action buttons are siblings within the row, not nested inside a clickable card.
- **Announce async outcomes where practical**: the per-row result region (status flip on success, inline error line) should be a polite live region (`aria-live="polite"`); the page-level error panel should be discoverable on load (`role="status"` or equivalent). The `Button` primitive already announces its own loading state.
- **Filter group**: `FilterTabs` already renders `role="group"` with `aria-pressed`; pass the group `aria-label` "Filter courses by status".
- **Reduced motion**: route any transitions through `motion-safe:`, honoring `prefers-reduced-motion`.

## 11. Design-Rule Compliance Notes

- **Product UI, not marketing**: the page uses the dashboard product shell (`px-8 py-8 pb-14 max-w-container mx-auto`), the product-register `text-title` header, and quiet typography. It deliberately avoids `Container`, `SectionHeader`, and `Stat`, keeping it on the app side of the register boundary.
- **No marketplace visuals**: no price, discount, "best seller", rating, enrollment-count, or urgency elements appear anywhere. Removing the slots from the row template is stronger than a style rule.
- **No public-catalog card clones**: this surface uses management rows, not the learner-facing `CourseCatalogCard`; the catalog card is intentionally not adapted here.
- **The Forest Rule (one primary per zone)**: exactly one primary button on the page, "Create course". Every per-row lifecycle action is secondary or ghost weight, so the list never becomes a wall of Salem buttons.
- **Flat-At-Rest Rule**: rows and panels carry no shadow at rest. No hover-lift in v1 (rows are multi-action, not single clickable targets).
- **Salem stays scarce**: Salem appears only as the Published badge tint, the selected filter tab tint, the primary "Create course" button, and focus rings. No Salem backgrounds, no Salem-filled button grids; well under the surface budget.
- **No prohibited patterns**: no gradient text, no glassmorphism, no hero-metric grids, no large Salem backgrounds, no decorative achievement visuals, no XP or leaderboard language.
- **Single typeface, restrained scale**: Inter only; the page steps `text-title` (h1) to `text-body-sm` (titles, body) to `text-caption` (meta), with no display sizes borrowed from marketing.
- **Three-tier depth max**: `bg-bg-base` (page) to `bg-surface` (rows, panels, inputs) to `bg-surface-elevated` (badge tint, tab hover). Nothing nests deeper.
- **No invented tokens**: every class referenced exists in `DESIGN.md` / `tokens.css` or in committed component code. The flagged judgment calls (mobile horizontal padding, instructor shell choice, StatePanel title line) are called out, not silently assumed.

## 12. Open Decisions

1. **Instructor course list endpoint (blocker).** No `GET /api/v1/instructor/courses` exists. Should the backend add a list endpoint (recommended: `GET /api/v1/instructor/courses` returning `List<CourseResponse>` scoped to the authenticated instructor, all statuses) before frontend implementation? Recommendation: **yes, this is a prerequisite** for real-data implementation. Until then the page is mock-only.
2. **Instructor shell vs learner `DashboardLayout`.** Should instructor pages reuse the learner `DashboardLayout` or get a separate `InstructorDashboardLayout`? Recommendation: a separate (even minimal) instructor shell, because the learner sidebar is learner-scoped and overloading it blurs the dual-profile boundary. v1 fallback: standalone page with a back link, with `InstructorDashboardLayout` as a fast follow.
3. **Create/edit: modal or route.** Recommendation: a dedicated route (`/instructor/courses/new`, `/instructor/courses/{id}/edit`) because the form depends on an async categories fetch. Modal acceptable if it owns its own loading/error states.
4. **Restorable archived courses.** Should archived courses be restorable later? Backend currently has no archived-to-published or archived-to-draft path (publish returns 409 on archived). Decision deferred to a backend change; do not build restore in v1.
5. **Editing published courses directly.** Backend currently allows `PATCH` on a published course. Should the product allow direct edits to a live course, or require an unpublish/edit/republish flow? There is no unpublish endpoint today, so v1 follows the backend and allows direct edit; revisit if content-integrity concerns arise.
6. **"View in catalog" link.** Should it open `/courses/{id}` once a public course detail page exists? That route does not exist yet (confirmed in the catalog spec). Until it does, omit the link or point it at `/courses`. Revisit when the detail route ships.
7. **Course content builder placement.** Should lessons/sections/quiz authoring live on this page or a separate course-editor surface? Recommendation: a separate surface. This page stays a list-and-lifecycle workspace in v1; content building is explicitly out of scope (§0).
