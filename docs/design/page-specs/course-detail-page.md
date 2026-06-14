# Course Detail Page UI & Interaction Specification

> No-implementation spec. This document defines the **public course detail page**: the surface where any visitor inspects a single published course before deciding to enroll. It is a documentation and design task only. Do not implement the React page, do not modify frontend or backend source code from this document without a follow-up task.
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use in `CourseCatalogPage.tsx`, `CourseCatalogCard.tsx`, `StatePanel.tsx`, `Badge.tsx`, `Button.tsx`, `Navbar.tsx`, and `Footer.tsx`. Where a role has no defined token, it is flagged as a design decision, not invented.
>
> Sibling specs: `docs/design/page-specs/course-catalog-page.md` (the list page that links here) and `docs/design/page-specs/course-player-page.md` (the protected, enrollment-gated player this page links into). This page sits between them: it is the public bridge from catalog browsing to enrolled learning.

---

## 0. Scope & Assumptions

This is a no-implementation visual and interaction specification for the **public course detail page**: a single-course product detail surface reachable from a catalog card. It is the missing link between the existing public catalog (`/courses`) and the protected course player (`/dashboard/courses/:courseId`).

**Verified in the repo (do not re-derive, do not re-invent):**

- `GET /api/v1/courses/{courseId}` exists in `CourseCatalogController` and is **public** (no auth). Verified in `CourseService.getPublishedCourse`: it loads the course, filters on `status == PUBLISHED`, and otherwise throws **404**. A non-existent course and a non-published (DRAFT or ARCHIVED) course are therefore **indistinguishable to the public: both return 404**. Drafts cannot be probed by id.
- The frontend client for this fetch **already exists**: `getPublishedCourse(courseId): Promise<CourseCatalogItem>` in `frontend/src/api/courses.ts`. This page needs **no new API client for the course fetch**; reuse the existing one.
- `POST /api/v1/courses/{courseId}/enroll` exists; the client `enrollInCourse(courseId): Promise<EnrollmentResponse>` already lives in `frontend/src/api/enrollments.ts`. Verified in `EnrollmentService.enroll` and `EnrollmentController`:
  - Success returns **201 CREATED** with an `EnrollmentResponse`.
  - A non-published or missing course returns **404**.
  - A duplicate enrollment returns **409**.
- `GET /api/v1/learner/enrollments` exists; the client `getMyEnrollments(): Promise<EnrollmentResponse[]>` already lives in `frontend/src/api/enrollments.ts`. Used here to detect whether the authenticated viewer is already enrolled.
- The backend DTO `CourseCatalogResponse` is verified field-for-field: `id, title, description, level, status, thumbnailUrl, categoryName, instructorName, createdAt`. It returns **no** rating, price, duration, lesson count, enrollment count, certificate flag, instructor bio, language, requirements, outcomes, or section list. This page must not display or fake any of those.
- The marketing `Navbar` (`frontend/src/components/marketing/landing/Navbar.tsx`) already supports a `forceSolid` prop that pins the solid (white background, dark links) state from scroll position zero. The catalog page already mounts it as `<Navbar forceSolid />`. This page does the same.
- The marketing `Footer` (`frontend/src/components/marketing/landing/Footer.tsx`) exists and is used by the catalog page.
- UI primitives available and used by the catalog: `Button`, `Badge`, `StatePanel` (calm bordered title/message panel with optional `onRetry`), `Bone` skeletons, and the `gradientForId(id)` deterministic placeholder utility from `frontend/src/components/dashboard/courseCardUtils`.
- `useAuth()` (`frontend/src/context/AuthContext.tsx`) exposes `isAuthenticated` and `user`. There is no per-course enrollment hook; the catalog page fetches `getMyEnrollments()` once and derives a `Set<courseId>`.

**Page behavior consequences of the above:**

- This page is **public**. There is no route guard. Guests can view it.
- It only ever renders **PUBLISHED** courses, because the backend returns only published courses; **DRAFT, ARCHIVED, or missing** courses return **404** and the page renders its Not-found state (§8).
- Authenticated learners who are not yet enrolled can **enroll** here.
- Authenticated learners who are already enrolled see a **Continue learning** action linking to `/dashboard/courses/:courseId`.
- **No public access to course content (sections, lessons, progress) is exposed on this page.** The learner course player at `/dashboard/courses/:courseId` remains protected and enrollment-gated; this page only links to it for already-enrolled users.

**Out of scope:** the React implementation, the course player itself, payment or checkout (Learnova v1 is free), backend changes, instructor or admin views, search and filtering (those belong to the catalog list page).

---

## 1. Route & Access

### Route

```
/courses/:courseId
```

Register as a **public** child of the pathless `RootLayout` in `frontend/src/router/index.tsx`, as a **sibling of the existing `/courses` route**, mirroring how `/dashboard/courses` (list) and `/dashboard/courses/:courseId` (player) coexist. React Router v7 resolves the static `/courses` list and the parameterized `/courses/:courseId` detail without conflict. No existing route is displaced.

Add a lazy import alongside the existing `CourseCatalogPage` import and wrap the element in `<Suspense fallback={null}>` (or a thin skeleton), consistent with the existing `/courses` entry.

### Guard

**None.** This is a public route, exactly like `/courses`. Do **not** wrap it in `ProtectedRoute`, `InstructorRoute`, or `AdminRoute`. A guest must be able to read the page and be offered a path to sign in.

- The page itself must **never** call `logout()` on 401 or navigate on 403. The shared Axios response interceptor (`setupApiInterceptors`, mounted by `ApiInterceptorSetup` in `RootLayout`) already owns 401 (logout + `/login`) and 403 (`/unauthorized`). The course fetch is public and will not 401/403; only the authenticated enroll/enrollments calls could, and those are interceptor-owned.

### Page chrome (marketing frame)

The page renders inside the public marketing frame, identical to the catalog page:

- `<Navbar forceSolid />` pinned at the top. `forceSolid` is mandatory: this page has no Salem hero, so the transparent-at-top navbar would render white links on `bg-bg-base` and be illegible.
- A spacer `<div className="h-nav-mobile md:h-nav" aria-hidden="true" />` to clear the fixed navbar (the navbar is `fixed`).
- `<Footer />` at the bottom.
- Include the same skip-to-content link the catalog page ships (`<a href="#main-content">Skip to main content</a>`), and give `<main>` `id="main-content" tabIndex={-1}`.

### Page title (document/H1)

Use the **course title from the backend** as the page's H1 (`course.title`). The catalog header uses a static "Explore courses"; this page is a single product, so its H1 is the course name. There is no `document.title` management convention in the repo today, so v1 sets the visible H1 only; wiring `document.title` is an optional, non-blocking enhancement.

### Redirect behavior after enrollment

**Do not auto-redirect after a successful enrollment.** Flip the side-panel action **in place** to the enrolled state (badge + "Continue learning"). Rationale: an abrupt redirect to the player is jarring on a public product page, and the learner may want to read more or navigate back to the catalog. The "Continue learning" link is the explicit, user-controlled path into the player. (Open decision 6 in §12 records the alternative.)

### Status-code behavior (page-local)

| Course fetch result | Page behavior |
|---|---|
| **200** | Render the detail page (§4–§7). |
| **404** (missing / draft / archived) | Render the **Not-found state** (§8): "Course not found" + back-to-courses link. No retry (retrying a 404 is pointless). |
| **Other failure** (500, network) | Render the **generic error state** (§8): "We could not load this course." + **Try again**. |

> Distinguishing 404 from other errors requires inspecting the Axios error's `response.status`, using the same `getHttpStatus(error)` helper pattern already present in `CourseCatalogCard.tsx`.

---

## 2. Backend Contract

### Primary: course detail

```
GET /api/v1/courses/{courseId}
Auth: Public
```

**Response body** (`CourseCatalogResponse`, verified field-for-field):

```jsonc
{
  "id": 12,
  "title": "Advanced React Patterns",
  "description": "A focused course on composition, state, and performance.",
  "level": "INTERMEDIATE",          // CourseLevel enum
  "status": "PUBLISHED",            // CourseStatus; always PUBLISHED on this endpoint
  "thumbnailUrl": "https://...",   // nullable
  "categoryName": "Development",    // nullable in the frontend type
  "instructorName": "Jane Doe",
  "createdAt": "2026-06-01T09:00:00Z" // Instant -> ISO string
}
```

**Exhaustive field list (do not assume any field not listed here exists):**

| Field | Type | Notes |
|---|---|---|
| `id` | number (Long) | |
| `title` | string | Page H1. |
| `description` | string | May be blank in practice; handle empty (§8). |
| `level` | `CourseLevel` enum | `BEGINNER` / `INTERMEDIATE` / `ADVANCED` / `ALL_LEVELS`. Render a label, never the raw enum (§3). |
| `status` | `CourseStatus` enum | Always `PUBLISHED` here. Do **not** render a status badge; it would be noise. |
| `thumbnailUrl` | string \| null | Plain URL string; no media upload exists. Null today for seeded data. |
| `categoryName` | string \| null | Show a category badge only when present. |
| `instructorName` | string | Display name only. **No bio, no avatar, no title.** |
| `createdAt` | string (ISO instant) | Optional, unobtrusive "Added {date}" line (§5). |

> **Fields that DO NOT exist and must not be rendered or implied:** price, rating, review count, duration, lesson count, section/syllabus list, certificate flag or promise, language, prerequisites/requirements, learning outcomes, enrollment count, instructor biography, video preview/trailer, lesson body or media.

### Enrollment mutation

```
POST /api/v1/courses/{courseId}/enroll
Auth: Authenticated (learner)
```

Verified status codes (from `EnrollmentService.enroll` + `EnrollmentController`):

| Result | Status | Meaning / page handling |
|---|---|---|
| Success | **201 CREATED** | Returns `EnrollmentResponse`. Flip side panel to enrolled state. |
| Duplicate | **409 CONFLICT** | Already enrolled. Treat as stale state: flip to enrolled, no error. |
| Unavailable | **404 NOT FOUND** | Course unpublished/removed between load and click. Calm inline error, disable action. |
| Unauthenticated / forbidden | **401 / 403** | Interceptor-owned; the page does nothing manual. |

`enrollInCourse(courseId)` in `frontend/src/api/enrollments.ts` is the client. It takes no body.

### Enrolled-state detection (authenticated viewers only)

```
GET /api/v1/learner/enrollments
Auth: Authenticated
```

Client: `getMyEnrollments()` in `frontend/src/api/enrollments.ts`, returning `EnrollmentResponse[]`. Each item carries `courseId`. The page checks whether this course's `id` appears in the returned list to decide between "Enroll" and "Continue learning".

> v1 reuses the list endpoint (one call, mirrors the catalog page) rather than `GET /api/v1/learner/enrollments/{courseId}`. The single-course lookup endpoint exists and returns 404 when there is no enrollment, but using it would couple "no enrollment" to a 404 that is easy to confuse with the public course 404. The list endpoint is the safer, already-proven pattern. Using the by-course endpoint instead is a minor implementation choice, not a contract change.

Guests never call the enrollments endpoint. If the enrollments fetch fails for an authenticated user, **degrade gracefully**: render the "Enroll" action and let the **409** path (§6) catch a duplicate.

---

## 3. Frontend State Model

Reuse the existing types; do not redefine them.

```ts
// Already exported from src/api/courses.ts. Reuse, do not duplicate.
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

interface CourseCatalogItem {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;            // always 'PUBLISHED' on this endpoint
  thumbnailUrl: string | null;
  categoryName: string | null;
  instructorName: string;
  createdAt: string;         // ISO instant
}
```

Level display labels (reuse the `LEVEL_LABELS` map already defined in `CourseCatalogCard.tsx`, or lift it to a shared module): `BEGINNER` → "Beginner", `INTERMEDIATE` → "Intermediate", `ADVANCED` → "Advanced", `ALL_LEVELS` → "All levels". Never render the raw enum string.

### Local UI state (page component)

| State | Type | Purpose |
|---|---|---|
| `course` | `CourseCatalogItem \| null` | Fetched payload. |
| `loading` | `boolean` | Initial course fetch in flight. |
| `error` | `'none' \| 'notFound' \| 'generic'` | Drives 404 vs generic error states (§8). A plain boolean is insufficient because the two states render differently. |
| `isAuthenticated` | `boolean` | From `useAuth()`. Selects guest vs learner CTA. |
| `isEnrolled` | `boolean` | Derived from the enrollments fetch (course `id` present in the set). |
| `enrollmentsLoading` | `boolean` | Enrolled-state detection in flight (authenticated only). The CTA may render a neutral resting "Enroll" while this resolves, then reconcile; do not block the whole page on it. |
| `enrollState` | `'idle' \| 'enrolling' \| 'failed' \| 'unavailable'` | Mirrors the `EnrollState` union already used in `CourseCatalogCard.tsx`. Drives the enroll button's loading/disabled/inline-error rendering. |

`courseId` comes from `useParams()`. Parse to a number; if it is not a positive integer, render the Not-found state without calling the API (a non-numeric id can never match a Long course id).

> No net-new API module is required: `getPublishedCourse`, `enrollInCourse`, and `getMyEnrollments` all already exist. A small `useCourseDetail(courseId)` hook is optional sugar, not a requirement.

---

## 4. Layout & Structure

### Page shell (public marketing frame)

```tsx
<>
  {/* skip link (same as catalog page) */}
  <Navbar forceSolid />
  <main id="main-content" tabIndex={-1} className="bg-bg-base">
    <div className="h-nav-mobile md:h-nav" aria-hidden="true" />
    <div className="px-8 py-12 pb-16 max-w-container mx-auto">
      {/* back link, detail header, two-column body OR a state panel */}
    </div>
  </main>
  <Footer />
</>
```

This is the **same outer shell as the catalog page** (`px-8 py-12 pb-16 max-w-container mx-auto` on `bg-bg-base`), preserving register continuity between the list and the detail. Do **not** use the marketing `Container` primitive here (that is the marketing-width primitive used inside `Footer`); the catalog's `max-w-container mx-auto` shell is the established public-content width. Do **not** use a Salem full-bleed marketing hero band.

### Top-to-bottom structure

1. **Back link** to `/courses`: quiet text link with a left arrow, "← Back to courses", `text-body-sm text-text-secondary hover:text-text-primary`, `mb-4`, focus-visible Salem ring. Mirrors the catalog/player back-link idiom.
2. **Detail header** (§5): thumbnail (or `gradientForId` placeholder), category badge, level label, course title (H1), description, instructor name, optional "Added {date}".
3. **Two-column body on desktop**:
   - **Main column (left):** the honest content sections (§7): "About this course", "Course details", "What you will access".
   - **Side action panel (right):** the single primary course action (§6).
4. **Loading / not-found / generic-error** states replace the body (§8).

### Desktop grid

```html
<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
  <!-- main: detail header + content sections -->
  <!-- aside: side action panel -->
</div>
```

`minmax(0,1fr)` on the main column prevents a long course title or description from forcing horizontal overflow. The action panel is a fixed `340px` rail on `lg`, matching the rail width used by the course player spec for visual continuity. Use `gap-6` (24px) for a slightly more editorial feel than the dashboard's `gap-4`, consistent with this being a Brand/Product bridge surface.

**Placement decision for the detail header:** the thumbnail and title may render either full-width above the grid, or inside the main column. v1 recommendation: **render the detail header full-width above the two-column grid**, then split into main content + side panel below it. This keeps the title as a clear single H1 spanning the page and lets the thumbnail use a comfortable 16:9 width. The side panel then sits beside the content sections, not beside the hero image.

### Mobile behavior (`< lg`)

Single-column stack, in DOM/visual order:

1. Back link
2. Detail header (thumbnail, badges, title, description, instructor)
3. **Side action panel** (the primary action), placed **above** the long content sections so the enroll/continue action is reachable without scrolling past the body copy
4. Content sections ("About", "Course details", "What you will access")

On `lg+`, the action panel moves into the right rail; on mobile it is a full-width block near the top.

### Wireframe (lg)

```
══════════ Navbar (forceSolid, fixed, h-nav) ════════════════════════════════
 px-8 py-12 pb-16 max-w-container mx-auto              (bg-bg-base)
┌───────────────────────────────────────────────────────────────────────────┐
│ ← Back to courses                              (text-body-sm, secondary)    │
│                                                                            │
│ ┌─────────────────────────────────────────────────────────────────────┐  │
│ │ ▒▒▒▒▒▒▒▒  16:9 thumbnail or gradientForId placeholder  ▒▒▒▒▒▒▒▒▒▒▒▒ │  │
│ └─────────────────────────────────────────────────────────────────────┘  │
│ [ DEVELOPMENT ]  Intermediate            (Badge default + level caption)   │
│ Advanced React Patterns                  (h1 · text-title / 600)           │
│ A focused course on composition, state…  (text-body · secondary, max 72ch) │
│ Jane Doe                                  (text-body-sm · secondary)        │
│ Added June 1, 2026                        (text-caption · muted, optional)  │
│                                                                            │
│ grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start                  │
│ ┌───────────────────────────────────┐ ┌────────────────────────────────┐  │
│ │ About this course                 │ │  Side action panel (aside)     │  │
│ │ (description, full)               │ │  ┌──────────────────────────┐  │  │
│ │                                   │ │  │ [ Enroll in course ]     │  │  │
│ │ Course details                    │ │  │  (one primary action)    │  │  │
│ │  Category · Development           │ │  └──────────────────────────┘  │  │
│ │  Level · Intermediate             │ │  helper text (guest only)      │  │
│ │  Instructor · Jane Doe            │ │                                │  │
│ │                                   │ │                                │  │
│ │ What you will access              │ │                                │  │
│ │ (honest generic explanation)      │ │                                │  │
│ └───────────────────────────────────┘ └────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
══════════ Footer ═══════════════════════════════════════════════════════════
```

### Responsive table

| Breakpoint | Shell | Columns | Action panel placement |
|---|---|---|---|
| base (`< 1024px`) | `px-8 py-12 pb-16 max-w-container mx-auto` | single column | Full-width block above content sections |
| `lg` (1024px+) | same | `lg:grid-cols-[minmax(0,1fr)_340px]`, `gap-6` | Right rail, beside content |

Thumbnail keeps `aspect-video` (16:9) at every breakpoint, per the Course Card signature component in DESIGN.md §5.

### Vertical rhythm

- Back link `mb-4`. Detail header block `mb-8`. Grid sections internally `gap-6` between columns; content sections separated by `mb-8` (or `space-y-8`).
- Inside the action panel: `p-6` (the 24px card padding default).

---

## 5. Detail Header

Renders above the two-column grid (full width).

| Element | Content | Typography | Weight | Color | Notes |
|---|---|---|---|---|---|
| Thumbnail | `course.thumbnailUrl` image, else `gradientForId(course.id)` block | | | | `aspect-video w-full rounded-lg overflow-hidden`, `object-cover`. Image `alt=""` when decorative (title is adjacent), gradient `aria-hidden="true"`. See fallback rule below. `mb-6`. |
| Category badge | `course.categoryName` | `Badge variant="default"` | 500 uppercase | `text-text-secondary` on `bg-surface-elevated` | Omit entirely when `categoryName` is null. |
| Level label | level display label | `text-caption` | 400 | `text-text-muted` | Sits next to the badge, `gap-2`. Plain text, not a badge. |
| H1 | `course.title` | `text-title` (28px) | `font-semibold` (600) | `text-text-primary` | Single H1. `mt-3`. |
| Description | `course.description` | `text-body` (16px) | 400 | `text-text-secondary` | `max-w-[72ch]`, `mt-3`. Empty-state handling in §8. (Full description here; no clamp on the detail page.) |
| Instructor | `course.instructorName` | `text-body-sm` | 400 | `text-text-secondary` | `mt-4`. Name only. Optionally prefix "By " for readability. No avatar, no bio. |
| Added date | formatted `course.createdAt` | `text-caption` | 400 | `text-text-muted` | Optional, `mt-1`. Format as a human date (for example "Added June 1, 2026"). Unobtrusive; omit if it adds noise. |

**Header scale decision:** the H1 stays at `text-title` (28px), the product-register page-header scale, matching the catalog page's "Explore courses" header. Do **not** use `text-headline` or `text-display`; those are marketing-hero scales and would overstate a single course on a restrained bridge page.

**Thumbnail fallback rule:** mirror `CourseCatalogCard`. Track a `thumbnailError` boolean; render the `<img>` only when `course.thumbnailUrl` is truthy and not errored, with `onError` flipping to the gradient. Otherwise render the deterministic gradient placeholder:

```tsx
<div
  aria-hidden="true"
  className="aspect-video w-full rounded-lg"
  style={{ background: `linear-gradient(140deg, ${gradient.from}, ${gradient.to})` }}
/>
```

No text, icon, or logo inside the placeholder.

**Do not show in the header:** rating, student/enrollment count, price, discount, duration, certificate claims, "best seller" or urgency language.

---

## 6. Side Action Panel

The side panel is the conversion surface and holds **exactly one primary action** (the Forest Rule: one primary button per view zone). Container:

```html
<aside className="bg-surface border border-border-default rounded-lg p-6">
```

No shadow at rest (Flat-At-Rest Rule). On `lg` it may be `lg:sticky lg:top-[calc(h-nav+gap)]` so it stays in view as the content column scrolls; sticky positioning is optional polish, not required for v1.

The panel has a short heading or none. v1: no heading is needed if the action is self-explanatory; an optional `text-title-sm` line such as "Start this course" is acceptable but must not duplicate the H1.

### Guest (not authenticated)

- **Primary action:** `Button variant="primary"` rendered `asChild` wrapping a `<Link to="/login">`, labeled **"Sign in to enroll"**. (`Button` already supports `asChild` via Radix `Slot`, used by the navbar.)
- **Helper line below:** `text-body-sm text-text-secondary`, "Create an account or sign in to enroll in this course." The word "account" may link to `/register`.
- Do not pop a modal, do not inline a login form.
- Whether `/login` should carry a return-redirect back to `/courses/:courseId` is an open decision (§12, decision 2); until decided, plain navigation to `/login` is the safe default, since `GuestRoute` already owns post-auth redirection away from auth pages.

### Authenticated, not enrolled

- **Primary action:** `Button variant="primary"` labeled **"Enroll in course"**, `aria-label="Enroll in {course.title}"`.
- On click: call `enrollInCourse(course.id)`. While in flight, use the Button's built-in `loading` state (spinner, disabled, `aria-busy`) by setting `enrollState = 'enrolling'`.
- **On success (201):** set `isEnrolled = true`, flip the panel to the enrolled state in place (§"Authenticated, enrolled"). Do **not** navigate (§1).
- Error handling: see "Error cases" below.

This is the **one** place enrollment is a **primary** Salem button. The catalog card deliberately uses a `secondary` button because a grid of primaries would erase Salem's authority; on a single-course detail page, one primary action is correct and on-brand.

### Authenticated, enrolled

- **Status:** `Badge variant="salem"` labeled **"Enrolled"** (the documented enrolled/active variant), reinforced by visible text, never color alone.
- **Primary action:** **"Continue learning"** linking to `/dashboard/courses/:courseId`. Render as `Button variant="primary"` `asChild` wrapping a `<Link>`, `aria-label="Continue learning {course.title}"`.
- This is the only place this public page references the protected player route, and it only does so for a user who already holds an enrollment. The link does not bypass the player's own enrollment gate; the backend still 404s the content API for anyone not enrolled.

### Error cases

Mirror the verified `CourseCatalogCard` branching (`getHttpStatus(error)`):

- **409 (duplicate enrollment):** treat as **stale state, not an error**. Set `isEnrolled = true` and flip to the enrolled state; optionally re-fetch `getMyEnrollments()` to reconcile. No red, no toast.
- **404 (course no longer available):** set `enrollState = 'unavailable'`, disable the action, and show a calm inline line: **"This course is no longer available."** in `text-body-sm text-text-secondary`, with `role="alert"`. A full course re-fetch (which would then render the Not-found state) is acceptable but not required.
- **401 / 403:** do nothing manual; the shared Axios interceptor owns these.
- **Other failures:** set `enrollState = 'failed'`, return the button to idle, and show **"Enrollment failed. Try again."** in `text-body-sm text-text-secondary` with `role="alert"`. No red panel, no toast system (none exists).

### Forest Rule for this page

- The side panel holds the **one** primary action.
- Do **not** repeat a primary enroll/continue button elsewhere on the page (for example, do not also place an enroll button in the header or at the bottom of the content sections). Secondary navigation (the back link) and the in-content "What you will access" copy do not count as primary actions.

---

## 7. Main Content Sections

The backend returns only `title`, `description`, `level`, `categoryName`, `instructorName`, `createdAt`. Keep every section honest: no invented syllabus, lesson list, outcomes, requirements, duration, or instructor biography.

Each section heading is `h2.text-title-sm font-semibold text-text-primary mb-2`. Sections are separated by `space-y-8`. These are plain content blocks, **not** cards (DESIGN.md: "Cards are a last resort"); use whitespace and headings, not bordered boxes, for the content column. The side panel is the only bordered surface.

### 1. About this course

- Renders `course.description` in full, `text-body text-text-secondary max-w-[72ch]`.
- If `description` is blank, show the empty-description fallback (§8) instead of an empty block. Do not fail the page.
- This may duplicate the header description on small screens; on `lg` the header description can be a short lead and "About" the full text. v1 simplest approach: put the **full** description here and keep the header description to the same text (acceptable), or omit the header description and rely on this section. Implementer's choice; do not show two different descriptions.

### 2. Course details

A short definition list of the real metadata, `text-body-sm`:

- **Category** · `categoryName` (omit the row if null)
- **Level** · level display label
- **Instructor** · `instructorName`

Render as a simple `<dl>` (label in `text-text-secondary`, value in `text-text-primary`) or label/value rows. Do **not** use the `Stat` primitive or any large-metric treatment. No icons required.

### 3. What you will access

A carefully worded, generic, honest explanation of what enrolling does. It must **not** imply lesson count, media, or a certificate. Suggested copy:

- "After enrolling, this course appears in your learning dashboard."
- "Course lessons are available from the course player once you are enrolled."

`text-body text-text-secondary max-w-[72ch]`. Do **not** add a fake syllabus, fake outcomes, fake lesson list, fake requirements, fake duration, or a certificate promise.

> If the backend later exposes a public section preview (§12, decision 3), this section becomes the natural home for a read-only outline. v1 ships the honest generic explanation only.

---

## 8. Loading, Not Found, and Error States

All states render inside the page shell (Navbar + spacer + content container + Footer always present), replacing the body.

### Loading

Skeleton in the established `Bone` idiom (mirror `CatalogSkeleton` in `CourseCatalogPage.tsx`), wrapped in `aria-hidden="true"`, no spinner:

- Back-link bone (`h-4 w-32`).
- A `aspect-video w-full rounded-lg` thumbnail bone.
- A title bone (`h-7 w-2/3`), a couple of description bones (`h-4 w-full`, `h-4 w-5/6`), an instructor bone (`h-3 w-40`).
- A side-panel bone block: a bordered `rounded-lg` container with a `h-11` button-shaped bone inside, reflecting the real two-column layout on `lg`.

### Not found (404: missing / draft / archived)

`StatePanel` (no `onRetry`; retrying a 404 is pointless):

- `title`: **"Course not found"**
- `message`: **"This course may no longer be available."**
- Below the panel, a quiet Salem text-link **"← Back to courses"** to `/courses` (same treatment as the header back link). `StatePanel` does not render arbitrary links, so render this link adjacent to the panel.

### Generic error (500 / network)

`StatePanel` with `onRetry`:

- `message`: **"We could not load this course."**
- The built-in **"Try again"** action re-runs the course fetch. Wrap in `role="status"` so it is announced, consistent with the catalog page's error rendering.

### Empty description (200, blank `description`)

Do not fail the page. In the "About this course" section (and/or the header description slot), show: **"No course description is available yet."** in `text-body text-text-muted`. All other sections render normally.

---

## 9. CTA Wiring from Catalog (future implementation requirements)

This section records how the catalog page (`CourseCatalogPage` / `CourseCatalogCard`) should link here. **It is a requirement note for the follow-up implementation task; this spec does not modify catalog code.**

- The catalog card should expose a path to this detail page. Two acceptable options:
  - **Make the course title a `<Link>`** to `/courses/:courseId`, or
  - **Add a "View details" text-link** in the card body.
- **Do not make the entire card a single clickable surface.** The card already contains interactive children (the Enroll button, the "Sign in to enroll" link, the "Continue" link). Nesting those inside an outer card-level link creates invalid nested interactive elements and ambiguous click targets. The catalog spec already notes the card is "not a clickable surface in v1" for exactly this reason.

**v1 recommendation:**

- Make the **course title a link** to `/courses/:courseId` (a single, well-labeled tab stop), and **keep the existing card-level Enroll CTA** as-is. This gives a quick-enroll path from the grid and a "read more" path to the detail page without nested-interactive conflicts.
- Whether to **move enrollment entirely to the detail page** (removing the card Enroll button) is an open decision (§12, decision 1). If chosen, the card simplifies to title-link + "Sign in to enroll"/"Continue" only, and this page becomes the sole enroll surface. v1 default keeps both.

When the title becomes a link, the catalog card may also adopt the hover-lift affordance on the body that the catalog spec reserved for "once a detail route exists"; that is a catalog-spec follow-up, noted here for continuity, not specified in detail.

---

## 10. Accessibility

- **Semantic heading order:** one `h1` (course title). Content section headings are `h2` ("About this course", "Course details", "What you will access"). No skipped levels. The optional side-panel heading, if used, is also `h2` (it is a sibling page section, not nested under a content `h2`).
- **Side action has a clear accessible label:** the enroll/continue control carries a course-specific accessible name ("Enroll in {title}", "Continue learning {title}", "Sign in to enroll in {title}"). A bare "Enroll" is acceptable visually but the `aria-label` must include the title.
- **Image alt text:** the thumbnail uses `alt=""` (decorative; the title is adjacent text) per the catalog card pattern. If a future decision makes the thumbnail meaningful, set `alt={course.title}`.
- **Placeholder thumbnail is decorative:** the `gradientForId` block is `aria-hidden="true"`.
- **Status and enrollment state are visible text, not color alone:** the "Enrolled" badge carries the word "Enrolled"; the Salem tint is reinforcement. Inline error lines are real text.
- **Errors use `role="alert"`** for the enroll inline errors (unavailable / failed) so they are announced; the generic page error panel is wrapped in `role="status"`. The enroll result region may be a polite live region (`aria-live="polite"`) as the catalog card does.
- **Focus states visible:** every interactive element keeps its `focus-visible` Salem ring (the primitives ship these; do not strip them). Buttons already enforce `min-h-[44px]`; text-links keep a 44px hit area as the catalog links do.
- **No nested interactive elements:** the back link, the side-panel action, and any in-content links are each standalone. Do not nest a button inside a link or a link inside a button.
- **Skip link + `main` focus target:** reuse the catalog page's skip-to-content link and `id="main-content" tabIndex={-1}` on `<main>`.
- **Motion:** any transitions use `motion-safe:` prefixes, honoring `prefers-reduced-motion`, consistent with `CourseCatalogCard` and `Navbar`.

---

## 11. Design-Rule Compliance Notes

- **Register: Brand/Product bridge.** Public and conversion-facing (Brand), but rendered with product-register restraint: `bg-bg-base`, `text-title` header, flat-at-rest surfaces, marketing chrome (Navbar/Footer) framing a quiet content column. This matches PRODUCT.md principle 3 (continuity across registers): a visitor sees the same product they will enter after enrolling.
- **Public product detail, not a dashboard.** No `Stat`, no `SectionHeader`, no `Container` (the catalog's `max-w-container mx-auto` shell is used instead), no dashboard metric strips.
- **No fake course metadata.** No price, rating, discount, duration, lesson count, certificate promise, enrollment count, language, requirements, outcomes, syllabus, instructor bio, or video preview. The content template has no slot for any of them; removing the slots is stronger than a style rule.
- **No marketing-hero exaggeration.** No `text-display`/`text-headline` hero, no Salem full-bleed band, no gradient text.
- **No prohibited patterns.** No glassmorphism, no card shadows at rest (only the side panel and any future hover-lift earn structure), no XP/leaderboard/trophy language or visuals, no large ambient Salem backgrounds.
- **The Forest Rule.** Salem appears only as: the single primary action in the side panel, the "Enrolled" badge tint, text-link actions/back links, and focus rings. Well under the 15% surface budget. No grid of Salem buttons.
- **The Field Rule.** Coral and Anzac do not appear on this page; nothing here is a warning or an achievement. (A future certificate or completion surface would be the place for Anzac, not this pre-enrollment page.)
- **Single typeface, restrained scale.** Inter only; the page steps `text-title` (h1) → `text-title-sm` (section/panel h2) → `text-body` (description, "what you will access") → `text-body-sm` (details, instructor) → `text-caption` (level, date). No in-between sizes.
- **Three-tier depth max.** `bg-bg-base` (page) → `bg-surface` (side panel) → `bg-surface-elevated` (badge tint). Nothing nests deeper.
- **No invented tokens.** Every class referenced exists in `tokens.css` or in committed component code. The two judgment calls (`gap-6` editorial spacing on the detail grid; optional `lg:sticky` side panel) are flagged here rather than silently assumed; both use existing spacing tokens.

---

## 12. Open Decisions

| # | Decision | v1 recommendation | Notes / blocker |
|---|---|---|---|
| 1 | Should catalog cards keep their direct Enroll CTA, or push enrollment to this detail page? | **Keep both**: title becomes a link to detail; card Enroll stays. | Moving enroll fully to detail simplifies the card but removes quick-enroll from the grid. Either is viable; this is a product preference, not a contract change. |
| 2 | Should `/login` support a return redirect back to `/courses/:courseId`? | **Not in v1.** | Nothing in the current auth flow supports redirect-back; `GuestRoute` redirects to `/` after auth. Adding return-to support is a separate auth-flow task touching `GuestRoute`/`LoginPage`. |
| 3 | Should the backend expose public section/lesson previews later? | **Possibly later.** | Today `CourseCatalogResponse` carries no sections. A public preview would need a new backend contract. **Blocked** until then; v1 ships the honest "What you will access" copy. |
| 4 | Should the backend expose an instructor bio later? | **Possibly later.** | No bio field exists today. **Blocked** until a contract addition; v1 shows the instructor name only. |
| 5 | Should the backend expose duration / lesson count later? | **Possibly later.** | No such fields exist. **Blocked**; do not fabricate. v1 omits them entirely. |
| 6 | Should an already-enrolled user see this page, or be redirected to the player? | **See the page; do not auto-redirect.** | Flip the CTA to "Continue learning" in place. Auto-redirecting an enrolled viewer away from a public URL is surprising and breaks shareable links. |
| 7 | Should archived courses remain visible to enrolled users in this public detail page? | **No (per current backend).** | `GET /api/v1/courses/{courseId}` returns 404 for non-PUBLISHED courses, so an archived course renders the Not-found state here even for an enrolled user. The enrolled user still reaches the content via the **player** (`/dashboard/courses/:courseId`), whose access is enrollment-based, not status-based (see course-player spec §0). Changing public visibility of archived courses would require a backend contract change. |
| 8 | Manage `document.title` to the course title? | **Optional, non-blocking.** | No title-management convention exists in the repo today. v1 sets the visible H1 only. |

---

## Implementation Readiness Summary (for the next session)

- **Build now:** the public detail page at `/courses/:courseId` (no guard, marketing chrome with `<Navbar forceSolid />` + `<Footer />`), back link, full-width detail header with thumbnail/`gradientForId` fallback, two-column body (content sections + side action panel) on `lg` collapsing to a single column on mobile, the three CTA states (guest / not-enrolled / enrolled) with the verified 201/409/404/401-403 handling, and all four render states (loading / not-found / generic-error / empty-description).
- **Reuse (no net-new API module needed):** `getPublishedCourse(courseId)`, `enrollInCourse(courseId)`, `getMyEnrollments()` (all in `src/api/`), plus `Button`, `Badge`, `StatePanel`, `Bone`, `gradientForId`, `Navbar`, `Footer`, `useAuth`, the `LEVEL_LABELS` map, and the `getHttpStatus` / `EnrollState` patterns from `CourseCatalogCard.tsx`.
- **Net-new (small):** one page component (suggested `src/features/catalog/pages/CourseDetailPage.tsx`), an optional `useCourseDetail(courseId)` hook, and one route entry in `router/index.tsx` as a sibling of `/courses`. A follow-up catalog change (title-as-link to detail) is recorded in §9.
- **Blocked (needs backend contract first):** public section/lesson previews, instructor bio, and duration/lesson-count display. Do not fabricate any of these.
```

