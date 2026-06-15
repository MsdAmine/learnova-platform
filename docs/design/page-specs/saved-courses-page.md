# Saved Courses Page — UI & Interaction Specification

> **No-implementation spec.** This document defines the **learner-dashboard Saved Courses page** (`/dashboard/saved-courses`): the surface where an authenticated learner browses every course they saved through the wishlist and removes courses they no longer want. It is a documentation and design task only. **Do not implement the React page, do not modify frontend or backend source code from this document without a follow-up task.**
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use in `MyCoursesPage.tsx`, `CourseCatalogCard.tsx`, `CourseDetailPage` (spec), `StatePanel.tsx`, `Badge.tsx`, `Button.tsx`, `DashboardLayout.tsx`, and `Bone.tsx`. Where a role has no defined token, it is flagged as a **design decision**, not invented.
>
> Sibling specs (read first for shared conventions): `docs/design/page-specs/wishlist-integration.md` (the catalog/detail save affordance and the backend contract), `docs/design/page-specs/my-courses-page.md` (the enrolled-courses dashboard list this page is a sibling of), and `docs/design/page-specs/course-detail-page.md` (where saving actually happens today). This page is the **saved-list discovery surface** that the wishlist-integration spec deferred as out of scope for its v1 (`wishlist-integration.md` §9).

---

## 0. Scope & Assumptions

This is a no-implementation visual and interaction specification for the **learner Saved Courses dashboard page**: a protected list of the courses a learner has saved to their wishlist, with the ability to remove them.

**Clarifications (treat as fixed constraints):**

- **The page is learner-protected.** It lives **under the existing `/dashboard` route**, inheriting `ProtectedRoute` (redirects unauthenticated users to `/login`). No new guard component is created.
- **It lists courses the learner saved through the wishlist** — the payload of `GET /api/v1/wishlist`. Nothing else.
- **It does not show enrolled courses as learning progress** unless enrollment data is separately fetched. v1 does **not** fetch enrollments here (§2, §10).
- **It does not expose protected lesson content.** A saved course is still gated by the enrollment check at `/dashboard/courses/:courseId` and the content APIs. Saving grants no access. This page links only to the **public** detail page (`/courses/:courseId`), never directly to the player.
- **It does not replace `/dashboard/courses`** (My Courses, enrolled list). Saved ≠ enrolled. They are independent backend concepts and independent pages.
- **It is allowed to link saved course cards to public detail pages** (`/courses/:courseId`). That is the primary navigation off each card.
- This is **Product UI inside the learner dashboard**, not marketing UI: restraint over ceremony, no social-favorite theatrics, no hero band.

**Verified in the repo (do not re-derive, do not re-invent):**

- The wishlist API client **already exists** in full: `frontend/src/api/wishlist.ts` exports `getMyWishlist(size = 200)`, `addToWishlist(courseId)`, `removeFromWishlist(courseId)`, plus the `WishlistCourse` and `Page<T>` types. **No net-new API module is required.**
- The backend `WishlistController` (`backend/.../course/controller/WishlistController.java`) is annotated `@PreAuthorize("hasRole('LEARNER')")` for the whole controller. Status codes verified field-for-field in `CourseService.addCourseToWishlist`, `removeCourseFromWishlist`, and `getLearnerWishlist` (§1).
- **No dashboard route or page exists for saved courses today.** `router/index.tsx` has no `/dashboard/saved-courses` entry; `DashboardLayout.tsx`'s `NAV_ITEMS` has no "Saved" item.
- **`MyCoursesPage.tsx` is the closest sibling pattern** and is fully built: page shell `px-8 py-8 pb-14 max-w-container mx-auto`, header (`h1.text-title` + `p.text-body-sm`), an optional summary strip, and a `loading / error / empty / list` state ladder driven by a `useEnrollments` hook, rendering `StatePanel`, `CourseCard`, `FeaturedCourseRow`, and `FilterTabs`.
- **`StatePanel`** (`components/dashboard/StatePanel.tsx`) takes `{ title?, message, onRetry? }` and renders a calm bordered panel; with `onRetry` it shows a "Try again" button. No red, no spinner, no illustration.
- **`Bone`** (`components/common/skeletons/Bone.tsx`) is `<div aria-hidden className="rounded-md skeleton-bone {className}" />` — the only skeleton primitive.
- **`gradientForId(id)`** (`components/dashboard/courseCardUtils.ts`) returns a deterministic `{ from, to }` Salem-ramp pair for a course id — the established thumbnail fallback.
- **`Button`** variants: `primary | secondary | ghost | inverted | destructive`; sizes `sm | md | lg` (all `min-h-[44px]`); `loading` prop (spinner + `aria-busy` + disabled); `asChild` via Radix `Slot`.
- **`Badge`** variants: `default | salem | coral | anzac | azure` (uppercase `text-caption` pill).
- **`useAuth()`** exposes `isAuthenticated` (`!!token`) and `user: { roles: string[]; ... } | null`. Roles are strings like `ROLE_LEARNER`.

**Key divergence from `MyCoursesPage` (drives the card spec, §4):** `WishlistCourse` (mirroring backend `CourseResponse`) is **richer** than the dashboard `Course` model. It carries `description`, `level`, `status`, `categoryName`, `instructorName`, and — unlike `EnrollmentResponse` — a real `thumbnailUrl`. There is **no `progress` field**, so this page renders **no progress bar** (a saved course is not being learned).

**Out of scope:** the React implementation; backend changes; a per-course wishlist status endpoint; search/sort/filter of the saved list; bulk remove; "move to enrolled" / one-click enroll-from-saved; folders, notes, priority, reminders, ratings; adding save controls to catalog cards (that is `wishlist-integration.md`'s open decision §10.1).

---

## 1. Route, Access & Backend Contract

### 1.1 Route

```
/dashboard/saved-courses
```

Register as a **child of the existing `/dashboard` route** in `frontend/src/router/index.tsx`, as a sibling of `courses` (My Courses), `progress`, `certificates`, etc. It therefore renders inside `DashboardLayout`'s `<main><Outlet /></main>` and inherits the topbar, sidebar, and scroll container.

Add a lazy import alongside the other dashboard pages and wrap the element in `<Suspense fallback={<DashboardPageSkeleton />}>`, consistent with every existing dashboard child:

```tsx
const SavedCoursesPage = lazy(() => import('../features/dashboard/pages/SavedCoursesPage'));
// ...
{ path: 'saved-courses', element: (<Suspense fallback={<DashboardPageSkeleton />}><SavedCoursesPage /></Suspense>) }
```

### 1.2 Guard

**Inherits `/dashboard`'s `ProtectedRoute`.** Do **not** add a new guard. `ProtectedRoute` already redirects unauthenticated users to `/login`.

- 401/403 are **owned by the shared Axios response interceptor** (`setupApiInterceptors`): 401 → logout + `/login`; 403 → `/unauthorized`. This page must **never** call `logout()` or navigate on those statuses itself.
- Because `WishlistController` requires `hasRole('LEARNER')`, an authenticated **non-learner** (an admin-only account without `ROLE_LEARNER`) would get a 403 → `/unauthorized` from the wishlist fetch. v1 reaches this page only via the learner sidebar (§7), so the practical exposure is small; treat any 403 as interceptor-owned. (Open decision §10 records whether to gate the *nav item* on `ROLE_LEARNER`.)

### 1.3 Backend contract (verified, do not invent)

This page uses exactly **two** of the three wishlist endpoints. The add endpoint is **not** used here (saving happens on the course detail page).

#### List my wishlist — the page's primary data source

```
GET /api/v1/wishlist?size=200
Auth: hasRole('LEARNER')
```

- Returns **200** with a **Spring `Page<CourseResponse>`**, *not* a flat array. Default paging is `size=10`; the client requests `?size=200` (the v1 cap already baked into `getMyWishlist`).
- **The frontend must read `data.content`** (an array of `WishlistCourse`), not treat the body as an array.
- `getMyWishlist(size?)` already returns `Page<WishlistCourse>`; the page reads `.content`.

`WishlistCourse` fields actually present (from `wishlist.ts` / backend `CourseResponse`):

| Field | Type | Use on this page |
|---|---|---|
| `id` | number | Card key; routes to `/courses/:id`; the id passed to `removeFromWishlist`. |
| `title` | string | Card title (link). |
| `description` | string | Card body, clamped. |
| `level` | `CourseLevel` | Level label (reuse `LEVEL_LABELS`). |
| `status` | string | `PUBLISHED` / `DRAFT` / `ARCHIVED` — wishlist read is **not** status-filtered. v1: do **not** render as a badge (§4, open decision §10). |
| `thumbnailUrl` | string \| null | Optional thumbnail with `gradientForId(id)` fallback. |
| `categoryName` | string \| null | Category badge, only when present. |
| `instructorName` | string | Instructor line (name only). |
| `categoryId`, `instructorProfileId`, `createdAt`, `updatedAt` | — | **Not rendered** in v1 (no honest, useful slot for them). |

> **Pagination consequence (handle, don't ignore):** the list endpoint defaults to `size=10`. The page requests `?size=200` so a learner's whole wishlist renders on one page for v1's small seed volume. This is a conscious cap (already commented in `wishlist.ts`), not silent truncation. True pagination / infinite scroll is open decision §10. If `totalElements > content.length`, the page is **not** showing everything — see §6 for the honest "showing N of M" note this would require.

#### Remove a course from my wishlist — the page's only mutation

```
DELETE /api/v1/wishlist/course/{courseId}
Auth: hasRole('LEARNER')
Request body: none
```

Verified status codes (from `CourseService.removeCourseFromWishlist`):

| Result | Status | Cause | Page handling (§5) |
|---|---|---|---|
| Success | **204 NO CONTENT** | Row deleted. | Remove the card locally; decrement count. |
| Course missing | **404 NOT FOUND** | `"Target course context not found"`. | Treat as stale — remove locally, no error. |
| Not in wishlist | **404 NOT FOUND** | `"This course was not found inside your wishlist"`. | Treat as stale — remove locally, no error. |
| No learner profile | **403 FORBIDDEN** | User has no `LearnerProfile`. | Interceptor-owned (`/unauthorized`). |
| Unauthenticated / non-learner | **401 / 403** | Token / role. | Interceptor-owned. |

> **The 404-on-delete is genuinely ambiguous** — the backend returns the same 404 whether the course was deleted entirely *or* simply isn't in this learner's wishlist. Both resolve the same way: the course is no longer in the list, which is exactly what "Remove" intends. Treat 404 on delete as **success-equivalent**, never as an error. Document this so the implementer does not surface a scary message for a remove that effectively succeeded.

**Do not invent** (none of these are returned and none may be rendered or implied): saved/added timestamp, note/comment field, folders, tags, priority, reminders, ratings, review count, price, discount, duration, lesson count, section/syllabus list, certificate flag or promise, enrollment count, instructor bio/avatar.

---

## 2. Frontend State Model

A small page component (suggested `frontend/src/features/dashboard/pages/SavedCoursesPage.tsx`). It may inline its data-fetching effect or, mirroring `MyCoursesPage`'s `useEnrollments`, extract a `useWishlist()` hook — implementer's choice, not a requirement.

| State | Type | Purpose |
|---|---|---|
| `loading` | `boolean` | Initial `getMyWishlist()` fetch in flight. Drives the skeleton (§6). |
| `error` | `boolean` | The wishlist fetch failed (non-401/403). Drives the error `StatePanel` (§6). A boolean is sufficient — there is no 404-vs-generic split on a list fetch (unlike the detail page). |
| `courses` | `WishlistCourse[]` | The saved list, from `page.content`. The page's source of truth. |
| `removingCourseId` | `number \| null` | The single course id whose DELETE is in flight. Drives that card's inline Remove loading/disabled state. One in-flight removal at a time is sufficient for v1. |
| `rowErrors` | `Record<number, true>` (or `Set<number>`) | Per-course inline error flag for a failed removal. Keyed by course id so one failed remove never blanks the page. |
| `retryTick` | `number` | Bumped by the error-panel "Try again" action to re-run the fetch effect (mirrors the `reload` pattern behind `useEnrollments`). |

### Derived state

| Derived | From | Use |
|---|---|---|
| `savedCount` | `courses.length` | Summary strip (§3). |
| `hasSavedCourses` | `courses.length > 0` | Selects list vs empty state (§6). |
| `totalElements` *(optional)* | `page.totalElements` | Only if the "showing N of M" honesty note (§6) is shown when the cap truncates. |

### Enrollment state — deferred in v1

**Do not fetch enrollments on this page in v1.** The saved list stands on its own. Fetching `getMyEnrollments()` to differentiate an "Enroll" vs "Continue" CTA per card adds a second network dependency, a second failure mode, and a stronger coupling to enrollment semantics than a "saved for later" list needs.

- **v1 navigation is a single neutral path:** each card links to the **public** detail page `/courses/:courseId`, where the real, already-built enroll/continue CTA logic lives (`course-detail-page.md` §6). The detail page already fetches enrollment state and renders the correct primary action. Routing there avoids duplicating that logic and keeps this page honest about what it knows.
- If enrollment differentiation is later wanted here (open decision §10), define it then: fetch `getMyEnrollments()` once, derive an `enrolledIds: Set<number>`, and let it choose a secondary CTA — exactly the `enrolledIds` pattern from the catalog. It stays **secondary**; "View details" remains the primary action.

---

## 3. Layout & Structure

The page is a single vertical content column inside `DashboardLayout > main`, using the **canonical dashboard page shell** (identical to `MyCoursesPage`):

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
  {/* header → summary strip → list | empty | error | loading */}
</div>
```

No `<Container>` primitive, no marketing `<section>` band, no Salem hero — those belong to public/marketing pages.

### Top-to-bottom structure

1. **Page header** — `mb-8` block:
   - `h1.text-title font-semibold text-text-primary` → **"Saved courses"**
   - `p.text-body-sm text-text-secondary mt-1` → **"Courses you saved for later."**
2. **Summary strip** *(only when `!loading && !error && hasSavedCourses`)* — a single inline `text-body-sm text-text-secondary` line, mirroring `MyCoursesPage`'s strip exactly:
   - **"{savedCount} saved courses"** with the count `font-semibold text-text-primary`. Pluralize ("1 saved course"). **Inline text only — not the `Stat` primitive.** `mb-8`.
3. **State ladder** (exactly one renders):
   - **Loading** → skeleton grid of `Bone` cards (§6).
   - **Error** → `StatePanel` with `onRetry` (§6).
   - **Empty** → `StatePanel` with an "Explore courses" link (§6).
   - **List** → the saved-course grid (below).
4. **Saved-course grid** — product cards, one per saved course:

```html
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
```

`items-start` keeps rows from stretching to the tallest card. Use **product cards, flat at rest** (border only, no shadow) — see §4. This grid intentionally differs from `MyCoursesPage`'s `sm:2 lg:3` breakpoints (`md:2 xl:3`) per the task's grid recommendation; both are valid Tailwind breakpoint choices and either may be reconciled in implementation — flag as a minor design decision.

### Content-column wireframe (xl)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside DashboardLayout > main)
┌────────────────────────────────────────────────────────────────────────────┐
│ Saved courses                            (h1 · text-title / 600)            │
│ Courses you saved for later.             (text-body-sm · text-secondary)    │
│                                                                             │
│ 3 saved courses                          (summary strip · inline text)      │
│                                                                             │
│ grid-cols-1 md:2 xl:3  gap-4  items-start                                   │
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐          │
│ │ ▒▒ 16:9 thumb ▒▒  │ │ ▒▒ gradientForId ▒│ │ ▒▒ 16:9 thumb ▒▒  │          │
│ │ [DEV] Intermediate│ │ [DESIGN] Beginner │ │ [DATA] Advanced   │          │
│ │ React Fundamentals│ │ Color Theory      │ │ SQL Deep Dive     │          │
│ │ short description…│ │ short description…│ │ short description…│          │
│ │ Jane Doe          │ │ Sara Lin          │ │ Omar Idris        │          │
│ │ View details   Rem│ │ View details   Rem│ │ View details   Rem│          │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Responsive table

| Breakpoint | Shell | Grid columns | Gap | Notes |
|---|---|---|---|---|
| base (< 768px) | `px-8 py-8 pb-14 max-w-container mx-auto` | 1 | `gap-4` | Sidebar is the off-canvas drawer owned by `DashboardLayout`. |
| `md` (768px) | same | 2 | `gap-4` | Sidebar becomes static (250px); column centers via `mx-auto`. |
| `xl` (1280px+) | same | 3 | `gap-4` | Full 3-up grid. |

### Vertical rhythm

- Header block `mb-8`; summary strip `mb-8`. Inside cards: content padding `p-4`; title→description `mb-1`; description→instructor `mb-2`; instructor→action row `mb-3`.

---

## 4. Card Behavior

Each saved-course card is a **product card, flat at rest** — `bg-surface border border-border-default rounded-lg overflow-hidden`, hover intensifies the border only (`hover:border-border-hover motion-safe:transition-colors duration-fast`). **No shadow at rest.** This mirrors `CourseCatalogCard`'s shell exactly. It is **not** a fully clickable surface (the card holds a title link + a Remove button, which would be invalid nested interactive elements under an outer link).

Show **only real backend fields**:

| Element | Source | Treatment | Notes |
|---|---|---|---|
| Thumbnail | `thumbnailUrl` → else `gradientForId(id)` | `aspect-video w-full object-cover` (img) / gradient `<div>` | Track a `thumbnailError` boolean per card; render `<img alt="" loading="lazy" onError={…}>` only when `thumbnailUrl` is truthy and not errored, else the deterministic gradient (`aria-hidden`). Identical to `CourseCatalogCard`. |
| Category badge | `categoryName` | `Badge variant="default"` | Omit entirely when null. |
| Level label | `level` | `text-caption text-text-muted`, beside the badge (`gap-2`) | Plain text via `LEVEL_LABELS`; never the raw enum. |
| Title | `title` | `h3.text-body-sm font-semibold text-text-primary line-clamp-2 mb-1`, wrapping a `<Link to="/courses/{id}">` | The title **is** the primary "view details" affordance (a single, well-labeled tab stop). Salem hover + focus-visible ring, like the catalog card title. |
| Description | `description` | `text-caption text-text-secondary line-clamp-2 mb-2` | Empty string handled gracefully (renders nothing extra; do not fail). |
| Instructor | `instructorName` | `text-caption text-text-secondary mb-3` | Name only. No avatar, no bio. |
| `status` | `status` | **Not rendered in v1.** | The list can contain `ARCHIVED`/`DRAFT` saved courses (not status-filtered). Rendering a status badge is open decision §10; v1 omits it to avoid noise. |

### Actions (card action row — `flex items-center justify-between`)

- **View details** → links to `/courses/:courseId`. Because the title is already a link to the same target, the explicit "View details" text-link is **optional secondary reinforcement**, not required. v1 recommendation: rely on the **title link** as primary navigation and add a quiet **"View details"** text-link only if the title alone reads as insufficiently actionable — implementer's choice. Treatment: `text-caption font-medium text-salem hover:text-salem-400`, `min-h-[44px]` hit area, focus-visible ring (the catalog "Continue →" link idiom).
- **Remove** → calls `removeFromWishlist(course.id)` (DELETE). See §5 for full behavior. Treatment: `Button variant="ghost" size="sm"` (Salem ghost), `aria-label="Remove {course.title} from saved courses"`, `loading={removingCourseId === course.id}`.

**Do not use** (no enrollment data is fetched in v1, and these fields do not exist):

- An **Enroll CTA** in v1 (would require fetching enrollment state — deferred, §2). Routing to detail delegates enrollment to the page that already owns it.
- price, rating, duration, lesson count, certificate claim.
- a thumbnail **only** if `CourseResponse` did not carry `thumbnailUrl` — but it **does**, so the thumbnail-with-`gradientForId`-fallback is permitted and recommended.

---

## 5. Remove Behavior

Clicking **Remove** on a card:

1. Set `removingCourseId = course.id`. The card's Remove control shows the `Button` primitive's built-in `loading` state (spinner, `aria-busy`, disabled). **Inline on that card only** — no full-page spinner, no page-level disabling.
2. Call `removeFromWishlist(course.id)`.

| Outcome | Status | Handling |
|---|---|---|
| **Success** | **204** | Remove the card from `courses` locally (filter by id). The `savedCount` derives down automatically; if it reaches 0, the empty state (§6) renders. Clear `removingCourseId`; clear any `rowErrors[id]`. |
| **Stale — already gone** | **404** (either backend message) | Treat as **success-equivalent**: remove the card locally, no error surfaced. The user's intent (remove) is satisfied. |
| **Generic failure** | 500 / network | Keep the card. Clear `removingCourseId`. Set `rowErrors[id]`, rendering a **calm inline card error**: **"We could not remove this course from saved courses."** in `text-caption text-text-secondary`, `role="alert"`, inside that card. **No full-page reload. No global page error for one failed remove.** Retrying is simply clicking Remove again. |
| **401 / 403** | — | Interceptor-owned; do nothing manual. |

**No modal confirmation.** Removing a wishlist item is low-risk and reversible — the learner can re-save the course from its detail page (`/courses/:courseId`). A confirm dialog would be ceremony the action does not warrant.

> Optimistic vs pessimistic removal is an implementation detail: v1 recommendation is **pessimistic** (remove only after 204/404 resolves) so a failed remove leaves the card in place with its inline error, rather than flickering it out and back. Either is acceptable as long as a generic failure ends with the card still present and its inline error shown.

---

## 6. Loading, Empty, and Error States

All states render inside the page shell, below the header (and, where applicable, the summary strip is hidden until the list resolves). Exactly one renders at a time, mirroring `MyCoursesPage`'s ladder.

### Loading

A skeleton grid of `Bone` cards (mirror `MyCoursesSkeleton` in `MyCoursesPage.tsx`), wrapped `aria-hidden="true"`, no spinner. Each bone card:

```html
<div className="rounded-lg overflow-hidden border border-border-default bg-surface">
  <Bone className="aspect-video w-full rounded-none" />
  <div className="p-4 flex flex-col gap-2">
    <Bone className="h-4 w-3/4" />   <!-- title -->
    <Bone className="h-3 w-1/2" />   <!-- instructor -->
    <Bone className="h-3 w-full" />  <!-- description line -->
  </div>
</div>
```

Render 3 (or 6) bone cards in the same `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4`.

### Empty (200, `content` empty)

`StatePanel`:

- `title`: **"No saved courses yet"**
- `message`: **"Save courses from the catalog to find them here later."**
- **Action:** an **"Explore courses"** link → `/courses`. `StatePanel` only renders a button-style `onRetry`; an *Explore* navigation link must be rendered **adjacent to / below the panel** as a quiet Salem text-link (same treatment as the panel's "Try again" action), or `StatePanel` may be extended to accept an optional action slot (flag as a small component decision). Do not abuse `onRetry` for navigation.

### Error (fetch failed, non-401/403)

`StatePanel` **with `onRetry`**:

- `title`: **"We could not load your saved courses."** (passed as `title`, or as `message` if no separate body is wanted — `StatePanel` requires `message`; supply the sentence as `message`).
- The built-in **"Try again"** action bumps `retryTick` to re-run the fetch. Optionally wrap in `role="status"` so it is announced, consistent with the catalog/My Courses error rendering.

### Filtered-empty

**Not needed** — there is no search/filter in v1. (If sort/filter is added later, add a "No saved courses match this filter." line in the `MyCoursesPage` idiom.)

### Truncation honesty note (only if the `size=200` cap is exceeded)

If `totalElements > content.length` (a learner saved more than the cap), append a quiet line below the grid: **"Showing the first {content.length} of {totalElements} saved courses."** in `text-caption text-text-muted`. This keeps the cap from silently reading as "you've seen everything." Not expected to trigger at v1 seed volume; it is the honest fallback if it does.

---

## 7. Dashboard Navigation

**Recommendation: add a single learner sidebar nav item now.** Without an entry point the route is undiscoverable, and a "Saved" item is a low-cost, conventional addition that does not overload the existing six-item nav.

In `DashboardLayout.tsx`, add one entry to the `NAV_ITEMS` array — placed directly after **My Courses**, since the two are sibling course lists:

```tsx
{ icon: Bookmark, label: 'Saved', path: '/dashboard/saved-courses', end: false },
```

- **Icon:** `Bookmark` from `lucide-react` (the established icon library; `Bookmark`/`BookmarkCheck` is the conventional "saved for later" glyph and is consistent with the existing `BookOpen`, `Award`, etc.). Flag the exact icon choice as a minor design decision.
- **Active-state behavior is automatic:** the `NavLink` mapping already applies `isActive ? 'bg-salem text-on-dark' : '…'` and the `min-h-[44px]`, focus-visible ring, and `closeSidebar` (mobile drawer) behavior to every item. The new item inherits all of it — **preserve it; do not special-case this item.**
- **`end: false`** is correct (it is not the index route).
- **Do not add a badge count** in the sidebar (no count is fetched at layout level, and a count chip would add noise and a layout-level data dependency).
- **Do not add admin or instructor navigation.** This is a learner surface only.

> **Non-learner consideration:** `NAV_ITEMS` is currently rendered unconditionally for everyone inside `DashboardLayout` (including admin-only accounts). The wishlist endpoints require `ROLE_LEARNER`, so an admin-only account clicking "Saved" would hit a 403 → `/unauthorized`. v1 recommendation: **gate the "Saved" nav item on `user?.roles.includes('ROLE_LEARNER')`** so it does not render for non-learners — a small conditional in the nav map. Captured as open decision §10. (Alternatively, accept the rare bounce, as the rest of the dashboard nav is also learner-oriented.)

**If the sidebar item is *not* added:** the only other entry points are (a) a link from `/dashboard/settings`, or (b) a "View your saved courses" link on the course detail page's saved state. Both are weaker for discoverability; the sidebar item is preferred.

---

## 8. Accessibility

- **One `h1`** — the page title "Saved courses". No skipped heading levels. (Cards use `h3` for titles, consistent with `CourseCatalogCard`; there is no intervening `h2` section, which is acceptable for a single flat list — or wrap the grid in a `<section aria-label="Saved courses">` as `MyCoursesPage` does.)
- **Each card title is a link** (`<Link to="/courses/:id">`) — a clear, well-labeled navigation target and tab stop. If a separate "View details" link is added, it must not duplicate the title link as a *second* identical tab stop without a distinguishing accessible name.
- **Remove `aria-label` includes the course title:** `aria-label="Remove {course.title} from saved courses"`. A page of bare "Remove" buttons fails screen-reader users.
- **Errors use `role="alert"`** — both the per-card inline remove error and (optionally) `role="status"` on the page-level error panel, so outcomes are announced. Consider wrapping each card's action/result region in `aria-live="polite"` (as `CourseCatalogCard` does) so the inline error is announced without stealing focus.
- **Saved count is visible text** — the summary strip renders the count as real text, not color or an icon.
- **No color-only state** — the (omitted) status, the category badge, and any future enrolled marker must always carry a text label; Salem tints are reinforcement only.
- **No nested interactive elements** — the title link and the Remove button are siblings inside the card; the card itself is not a link/button.
- **Focus states visible** — reuse the primitives' `focus-visible` Salem outlines on the title link, the Remove button, and the empty/error actions. Do not strip them.
- **Touch targets ≥ 44px** — `Button` already enforces `min-h-[44px]`; text-links (title, "View details", "Explore courses") keep a `min-h-[44px]` hit area as the catalog links do.
- **Skeletons `aria-hidden`** — the loading grid is decorative; the real announcement is the list/empty/error that follows.
- **Motion** via `motion-safe:` prefixes only, honoring `prefers-reduced-motion`. No favorite-style animation on remove.

---

## 9. Design Constraints (compliance & prohibitions)

This page is **Product-register restraint** inside the dashboard, sibling to `MyCoursesPage`. It **must not** introduce any of:

- **Prohibited components/treatments:** marketing hero, `Stat`, `SectionHeader`, the marketing `Container` primitive, glassmorphism, gradient text, card shadows at rest, large Salem ambient backgrounds.
- **Prohibited fabricated fields:** fake lesson counts, fake duration, fake certificate promise, price, rating, discount.
- **Prohibited language:** pricing/rating/discount language; XP, trophy, leaderboard, or achievement/gamification framing. Saving is a calm utility, not a reward.
- **The Forest Rule:** Salem appears only as text-link tints (title hover, "View details", "Explore courses"), the `ghost` Remove button's Salem text, badge tints, and focus rings. **No grid of Salem-filled buttons.** There is no primary Salem button on this page (the enroll primary lives on the detail page), which is correct — a saved-list is browse-and-prune, not a conversion surface.
- **The Field Rule:** Coral and Anzac do not appear — saving is neither a warning nor an achievement. The Remove control is a **`ghost`** action, **not** `destructive`/`error` red: removing a free saved item is low-stakes and reversible.
- **Flat-At-Rest:** cards carry no shadow; hover intensifies the border only. The `StatePanel` is the only other bordered surface.
- **Three-tier depth max:** `bg-bg-base` (page) → `bg-surface` (card / panel) → `bg-surface-elevated` (badge tint). No deeper nesting.
- **Single typeface, restrained scale:** Inter only; `text-title` (h1) → `text-body-sm` (subtitle / summary / card title) → `text-caption` (badges, level, description, instructor, inline errors). No `Stat`/`Container`/`SectionHeader` display sizes.

---

## 10. Open Decisions

| # | Decision | v1 recommendation | Notes / blocker |
|---|---|---|---|
| 1 | Add the **sidebar nav item** now or later? | **Now** (§7). | A single "Saved" item after "My Courses"; route is undiscoverable without it. |
| 2 | Should the saved-courses page show **enrolled state** by fetching enrollments? | **No in v1.** | Adds a second fetch + failure mode. Navigation routes to the public detail page, which already owns enroll/continue logic. Add later if a secondary enroll/continue CTA per card is wanted. |
| 3 | Should **enrolled courses remain** in the saved list? | **Yes.** | Enrollment and saving are independent backend concepts; the API never auto-removes. Hiding enrolled-but-saved courses would be an arbitrary UI rule and require fetching enrollments (decision 2). |
| 4 | Should **enrolling auto-remove** a saved course? | **No.** | The backend does nothing automatic; the frontend should not silently delete a saved row on enroll. If desired, it is a backend behavior change, not a frontend trick. (Same as `wishlist-integration.md` §10.5.) |
| 5 | Should **catalog cards get save controls** later? | **Deferred** (owned by `wishlist-integration.md` §10.1). | Not this page's concern; noted for continuity. |
| 6 | Should the backend add a **per-course wishlist status endpoint**? | **Not required for this page.** | This page reads the full list, so it needs no membership check. The catalog/detail derived-set pattern is the only consumer that would benefit; revisit if catalog save controls ship. |
| 7 | Should the backend paginate saved courses with **infinite scroll or normal pagination** later? | **Single large page (`?size=200`) in v1; comment the cap.** | Acceptable at seed volume. The §6 "showing N of M" note is the honest fallback. Move to real paging / infinite scroll when volume grows. |
| 8 | How should a **non-`PUBLISHED` saved course** (`DRAFT`/`ARCHIVED`) surface? | **Render normally, no status badge, in v1.** | The list is not status-filtered. The card links to `/courses/:id`, which 404s for non-published courses (`course-detail-page.md` §1) — a known dead-end. Options for later: dim/disable such cards, show a "No longer available" badge, or hide them. Captured, not blocking v1. |
| 9 | Should the **"Saved" nav item be gated** on `ROLE_LEARNER`? | **Yes — gate it** (§7). | Avoids a 403 → `/unauthorized` bounce for admin-only accounts. Small conditional in the nav map. |
| 10 | Should `StatePanel` gain an **optional action-link slot** (for "Explore courses")? | **Render the link adjacent in v1**; extend `StatePanel` only if reused. | Avoids overloading `onRetry` (which is a button, not a link). A small, optional component refinement. |

---

## 11. Implementation Readiness

**API functions already exist (no net-new API module):**

- `getMyWishlist(size = 200)` → reads `Page<WishlistCourse>.content`. ✅ in `src/api/wishlist.ts`.
- `removeFromWishlist(courseId)` → DELETE, 204/404. ✅ in `src/api/wishlist.ts`.
- `addToWishlist(courseId)` — **not used here** (saving happens on the detail page).

**Route to add:**

- `frontend/src/router/index.tsx`: a lazy `SavedCoursesPage` and a `{ path: 'saved-courses', … }` child under the existing `/dashboard` `ProtectedRoute`, with `<Suspense fallback={<DashboardPageSkeleton />}>`.

**Page to create:**

- `frontend/src/features/dashboard/pages/SavedCoursesPage.tsx` — header + summary strip + loading/empty/error/list ladder + the saved-course grid and card. Optional `useWishlist()` hook (mirrors `useEnrollments`).

**Sidebar nav decision:**

- Add `{ icon: Bookmark, label: 'Saved', path: '/dashboard/saved-courses', end: false }` to `NAV_ITEMS` in `DashboardLayout.tsx`, after "My Courses"; gate on `ROLE_LEARNER` (open decisions §10.1, §10.9).

**Components to reuse:**

- `StatePanel`, `Bone`, `Badge`, `Button` (`ghost` for Remove), `gradientForId`, the `LEVEL_LABELS` map and `getHttpStatus`/`thumbnailError` patterns from `CourseCatalogCard.tsx`, the page-shell + summary-strip + skeleton idioms from `MyCoursesPage.tsx`. A new card component (suggested `SavedCourseCard`) is the only net-new presentational piece; it may share structure with `CourseCatalogCard` but not its enroll logic.

**QA cases:**

1. Learner with saved courses → grid renders; count matches `content.length`; each title links to `/courses/:id`.
2. Learner with no saved courses → empty `StatePanel` "No saved courses yet" + "Explore courses" → `/courses`.
3. Fetch fails (500/network) → error `StatePanel` + "Try again" re-runs the fetch.
4. Remove a course → 204 → card disappears, count decrements; removing the last card shows the empty state.
5. Remove a course already gone → 404 (either message) → card removed locally, no error.
6. Remove fails (500/network) → card stays, inline `role="alert"` "We could not remove this course from saved courses."; other cards unaffected; clicking Remove again retries.
7. Course with `thumbnailUrl` → image renders; broken/absent URL → `gradientForId` fallback.
8. Course with null `categoryName` → no category badge; level label still shows.
9. Saved `ARCHIVED`/`DRAFT` course → renders normally; clicking through to `/courses/:id` shows the detail page's Not-found state (known §10.8 dead-end).
10. Keyboard-only: title link, Remove, and empty/error actions reachable and operable; focus rings visible; Remove announces its result; saved count is real text.
11. `prefers-reduced-motion`: no remove animation; transitions degrade to instant.
12. Admin-only account (no `ROLE_LEARNER`): "Saved" nav item hidden (if gated, §10.9); direct navigation → wishlist 403 → `/unauthorized` (interceptor-owned).

**Blocked (needs backend contract first):** per-course wishlist status endpoint (not needed here), instructor bio/avatar, duration/lesson-count, saved timestamp. Do not fabricate any of these.
