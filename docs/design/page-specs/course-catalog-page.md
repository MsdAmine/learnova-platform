# Course Catalog Page UI Layout Specification

## 0. Scope & Assumptions

This is a no-implementation visual and interaction specification for the **public course catalog page**: the surface where any visitor (authenticated or not) browses published courses and where authenticated learners enroll. It is the missing frontend entry point for the backend catalog API that already exists.

**Verified in the repo (do not re-derive, do not re-invent):**

- `GET /api/v1/courses` and `GET /api/v1/courses/{courseId}` exist in `CourseCatalogController` and are public. They expose only `PUBLISHED` courses.
- `POST /api/v1/courses/{courseId}/enroll` exists; the frontend client `enrollInCourse(courseId)` already lives in `frontend/src/api/enrollments.ts` and uses the shared Axios instance.
- Enrollment into a non-published course returns `404`. Duplicate enrollment returns `409`.
- The backend DTO is `CourseCatalogResponse`: `id, title, description, level, status, thumbnailUrl, categoryName, instructorName, createdAt`. It deliberately returns **no** rating, price, duration, lesson count, enrollment count, or certificate flag. The catalog UI must not display or fake any of those.
- The marketing `Navbar` (`frontend/src/components/marketing/landing/Navbar.tsx`) and `Footer` (`components/marketing/landing/Footer.tsx`) exist and already link "Course catalog" to `/courses`. The landing hero "Explore" CTA also targets `/courses`.
- UI primitives available: `Button`, `Badge`, `Input`/`FormField`, `FilterTabs`, `ProgressBar`, `StatePanel` (calm bordered empty/error panel with optional "Try again"), `Bone` skeletons, and the dashboard `CourseCard` family.
- No backend search, filtering, sorting, or pagination exists on the catalog endpoint. All list refinement in v1 is client-side over the fetched array.
- No course detail page or `/courses/:courseId` route exists in the router yet. This spec covers the catalog list page only; the detail endpoint exists on the backend but a detail page is an open decision (§11).

**Out of scope:** the React implementation, the course detail page, payment or checkout (Learnova v1 is free), backend changes, instructor-facing views.

## 1. Route & Register Classification

**Route: `/courses`.** This is not a recommendation to debate; it is the existing convention. The landing page hero CTA and the marketing navbar both already link to `/courses`. Register the route as a **public** child of the pathless `RootLayout` in `src/router/index.tsx`, sibling to `/` and `/unauthorized`, with **no guard**: guests must be able to browse.

**Register: Brand/Product bridge, weighted toward Product.**

- It is public and conversion-facing like a Brand surface: it is where the landing page sends visitors, and where a guest decides Learnova is worth an account.
- It must read like a **professional course library, not a marketplace**. PRODUCT.md names Udemy's bazaar catalog as an explicit anti-reference: no discount badges, no countdowns, no "best seller" clutter, no price overlays, no urgency theater.
- Practical consequence: the page uses the marketing chrome (Navbar + Footer) but the **content area follows product-register restraint**: neutral `bg-bg-base` background, flat-at-rest cards, quiet typography, one calm header. It may carry slightly more visual polish than dashboard pages (real thumbnails, a fuller card body, a visible CTA per card) but no Salem full-bleed sections, no `text-display` hero, no Stat grids.

**Page chrome.** The catalog renders inside the public marketing frame: `<Navbar />` on top, `<Footer />` at the bottom, catalog content between them.

> **Required navbar adaptation.** The existing `Navbar` starts transparent with white links and only switches to its solid (white background, dark links) state after scrolling past a hero or brand-intro element. The catalog has no Salem hero, so the transparent state would render white text on `bg-bg-base` and be illegible. The catalog page must mount the navbar in its **solid state from scroll position zero**. Recommended approach: a `variant="solid"` (or similar) prop on `Navbar` that pins the existing scrolled styling; the exact mechanism is an implementation detail, but shipping the catalog with the transparent-at-top navbar is a defect, not a polish item.

Because the navbar is `fixed`, the catalog content must clear it: offset the top of the page by the existing nav height tokens (`h-nav` 72px desktop, `h-nav-mobile` 64px mobile) before the content padding begins.

## 2. Course Catalog State Model

**Item model.** Mirror `CourseCatalogResponse` field for field. `Instant` serializes to an ISO string.

```ts
type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

type CourseCatalogItem = {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;            // always 'PUBLISHED' on this endpoint
  thumbnailUrl: string | null;
  categoryName: string | null;
  instructorName: string;
  createdAt: string;         // ISO instant
};
```

Level display labels: `BEGINNER` renders "Beginner", `INTERMEDIATE` renders "Intermediate", `ADVANCED` renders "Advanced", `ALL_LEVELS` renders "All levels". Never render the raw enum string.

**Page-level states** (mutually exclusive):

| State | Condition | Renders |
|---|---|---|
| Loading | catalog fetch in flight | skeleton grid (§8) |
| Loaded | fetch resolved, list non-empty | toolbar + grid |
| Empty | fetch resolved, zero published courses | catalog empty panel (§8) |
| Filtered-empty | list non-empty, but search/filter matches nothing | toolbar stays, inline empty message (§8) |
| Error | fetch rejected | error panel with retry (§8) |

**Per-card CTA states**, derived from auth state (`useAuth()`) plus, when authenticated, the learner's enrollments (`getMyEnrollments()`):

| State | Condition | CTA |
|---|---|---|
| Guest | not authenticated | "Sign in to enroll" linking into the auth flow (§7) |
| Not enrolled | authenticated, course not in enrollments | "Enroll" button |
| Enrolling | enroll request in flight for this course | same button, `loading` state, disabled |
| Enrolled | course present in enrollments | "Enrolled" badge + "Continue" link to `/dashboard/courses` |

Enrollment data is fetched once on page load **only when authenticated**; guests never call the learner enrollments endpoint. If the enrollments fetch fails, degrade gracefully: render all cards in the "Not enrolled" state and let the `409` path (§7) catch duplicates.

## 3. Layout & Structure

The page is a single vertical column between Navbar and Footer:

```tsx
<main className="bg-bg-base">
  {/* top offset clearing the fixed navbar: h-nav-mobile md:h-nav */}
  <div className="px-8 py-12 pb-16 max-w-container mx-auto">
```

Top-to-bottom structure:

1. **Page header**: `h1` "Explore courses" + one subtitle line: "Find structured courses designed for focused professional growth." Calm and direct; no exaggerated claims, no course counts in the header.
2. **Toolbar**: search input (left) + category filter (right on desktop, stacked below search on mobile). Frontend-only refinement over the fetched list; the UI must not imply server-side search.
3. **Course grid**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start`, one `CourseCatalogCard` (§6) per published course.
4. **Empty / filtered-empty / error states** replacing or following the grid per §2 and §8.

### Wireframe (lg)

```
══════════ Navbar (solid state, fixed, h-nav) ═══════════════════════════════
 px-8 py-12 pb-16 max-w-container mx-auto          (bg-bg-base)
┌─────────────────────────────────────────────────────────────────────────┐
│ Explore courses                            (h1 · text-title / 600)       │
│ Find structured courses designed for       (text-body-sm · secondary)    │
│ focused professional growth.                                             │
│                                                                          │
│ [ 🔍 Search courses…            ]   [ All ][ Development ][ Design ]     │
│   (Input, max-w)                      (FilterTabs from categoryName)     │
│                                                                          │
│ grid-cols-1 sm:2 lg:3  gap-4  items-start                                │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│ │ ▒▒ 16:9 ▒▒   │ │ ▒▒ 16:9 ▒▒   │ │ ▒▒ 16:9 ▒▒   │  thumbnail or tonal   │
│ │ CATEGORY · Beginner            │ │   placeholder │  (Badge + level)     │
│ │ Title (title clamp-2)          │ │              │                       │
│ │ Description (clamp-2)          │ │              │                       │
│ │ Instructor name                │ │              │                       │
│ │ ───────────────                │ │              │                       │
│ │        [ Enroll ]│ │ Enrolled · Continue →      │  action row           │
│ └──────────────┘ └──────────────┘ └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────┘
══════════ Footer ═══════════════════════════════════════════════════════════
```

### Vertical rhythm

- Header block: `mb-8` (h1, then subtitle at `mt-1`).
- Toolbar row: `mb-8`, internal `gap-4` between search and filters.
- Grid gap: `gap-4`; `items-start` so rows do not stretch to the tallest card.
- Inside cards: see §6.

### Toolbar composition

- **Search**: the existing `Input` primitive, with a visible or `sr-only` `<label>` ("Search courses"). Placeholder: "Search courses". Matches against `title`, `description`, and `instructorName`, case-insensitive, client-side. Constrain width on desktop (around `max-w-sm` scale) so it does not span the full container.
- **Category filter**: the existing `FilterTabs` component, options derived at runtime from the distinct non-null `categoryName` values in the response, prefixed with an "All" option. If more than roughly six categories come back, switch to a native `<select>` styled with the Input tokens rather than letting tabs wrap into a second line; with current seed data, tabs are expected to fit.
- **Level filter**: the DTO returns `level`, so a level refinement is legitimate, but to keep the toolbar quiet v1 ships search + category only. Level appears as metadata on the card. Adding a level control later is noted in §11.
- No sorting control in v1. Default order is the API order. Do not add client-side sort UI without a reason.

## 4. Responsive Behavior

| Breakpoint | Grid columns | Toolbar | Notable |
|---|---|---|---|
| base (< 640px) | 1 | search full-width, category tabs wrap below (`flex-col gap-4`); tabs scroll horizontally if needed | navbar height `h-nav-mobile` (64px); navbar collapses to hamburger (existing behavior) |
| `sm` (640px) | 2 | search + tabs share one row when they fit (`flex-row`, search first) | |
| `md` (768px) | 2 | single toolbar row, search constrained width, tabs right-aligned | navbar height `h-nav` (72px) |
| `lg` (1024px+) | 3 | same as md | full 3-up grid |

Horizontal padding stays a flat `px-8` to match the established page shells. Tightening to `px-4 sm:px-8` on mobile is the same open refinement flagged in the My Courses spec; do not decide it here unilaterally.

Card thumbnails keep `aspect-video` (16:9) at every breakpoint, per the Course Card signature component in DESIGN.md §5.

## 5. Token Mapping

All tokens below exist in `DESIGN.md` / `tokens.css` and are already used by committed code. Nothing is invented.

### Page shell & header

| Element | Typography | Weight | Text color | Background | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| `<main>` | | | | `bg-bg-base` | none | top offset `h-nav-mobile md:h-nav` |
| Content shell | | | | inherits | none | `px-8 py-12 pb-16 max-w-container mx-auto` |
| H1 "Explore courses" | `text-title` | `font-semibold` (600) | `text-text-primary` | | none | header block `mb-8` |
| Subtitle | `text-body-sm` | 400 | `text-text-secondary` | | none | `mt-1` |

The header stays at `text-title` (28px), the product-register page header scale. Do not use `text-headline` or `text-display`; those belong to marketing sections, and this page must feel continuous with the app the visitor is about to enter.

### Toolbar

| Element | Typography | Weight | Text color | Background | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Search input | `text-body` | 400 | `text-text-primary`, placeholder `text-text-muted` | `bg-surface` | `border-border-default`, `rounded-md`, focus border `salem` | `py-3 px-4` (Input defaults) |
| Search label (if visible) | `text-body-sm` | `font-medium` (500) | `text-text-secondary` | | none | `gap-xs` (FormField default) |
| Filter tab, selected | `text-body-sm` | 500 | `text-salem` | `bg-salem-50` | `rounded-md` | `px-3 py-1.5` (FilterTabs defaults) |
| Filter tab, idle | `text-body-sm` | 500 | `text-text-secondary`, hover `text-text-primary` | hover `bg-surface-elevated` | `rounded-md` | |

### Course card (full mapping in §6)

| Element | Typography | Weight | Text color | Background | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Card shell | | | | `bg-surface` | `border border-border-default`, `rounded-lg`, `overflow-hidden` | no shadow at rest |
| Thumbnail / placeholder | | | | image or Salem-ramp gradient (`gradientForId`) | | `aspect-video w-full` |
| Category badge | `text-caption` | 500, uppercase | `text-text-secondary` | `bg-surface-elevated` | `rounded-full` | `px-2.5 py-0.5` (Badge `default`) |
| Level text | `text-caption` | 400 | `text-text-muted` | | none | `gap-2` from badge |
| Title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | | none | `line-clamp-2 mb-1` |
| Description | `text-caption` | 400 | `text-text-secondary` | | none | `line-clamp-2 mb-2` |
| Instructor | `text-caption` | 400 | `text-text-secondary` | | none | `mb-3` |
| "Enroll" button | `text-btn-sm` | 600 | `text-text-primary` | `bg-surface` (Button `secondary`, `sm`) | `border-border-default`, `rounded-md` | `py-2 px-4`, `min-h-[44px]` |
| "Enrolled" badge | `text-caption` | 500, uppercase | `text-salem` | `bg-salem-50` | `rounded-full` | Badge `salem` variant |
| "Continue →" link | `text-caption` | `font-medium` (500) | `text-salem`, hover `text-salem-400` | | none | `gap-1`, `min-h-[44px]` hit area |

### State panels

| Element | Typography | Weight | Text color | Background | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Empty/error panel | `text-body-sm` | 400 | `text-text-secondary` | `bg-surface` | `border-border-default`, `rounded-lg` | `px-6 py-12 text-center` (StatePanel) |
| "Try again" action | `text-body-sm` | 500 | `text-salem`, hover `text-salem-400` | | none | `mt-4`, `min-h-[44px]` |
| Filtered-empty line | `text-body-sm` | 400 | `text-text-muted` | | none | `py-10 text-center` |
| Skeleton bones | | | | `Bone` component defaults | matches card shapes | mirrors grid layout |

## 6. Course Card Specification

A new component, working name `CourseCatalogCard`, kept local to the catalog feature (for example `src/features/catalog/components/`). It is **not** the dashboard `CourseCard`: that component is enrollment-state-driven (progress, Done badge) and consumes the `Course` shape, while the catalog card is decision-driven (description, level, explicit CTA) and consumes `CourseCatalogItem`. Sharing tokens, not code, is correct here.

**Structure, top to bottom:**

1. **Thumbnail**: `aspect-video w-full`, `object-fit: cover`, no rounding of its own (the card's `overflow-hidden` clips it). If `thumbnailUrl` is null or fails to load, render the tonal gradient placeholder from the existing `gradientForId(course.id)` utility, `aria-hidden="true"`. No text, icon, or logo inside the placeholder.
2. **Body** (`p-4`):
   - **Meta row**: category `Badge variant="default"` (omit when `categoryName` is null) and the level label as plain `text-caption text-text-muted` text. One quiet row, `mb-2`.
   - **Title**: `text-body-sm font-semibold text-text-primary line-clamp-2 mb-1`.
   - **Description**: `text-caption text-text-secondary line-clamp-2 mb-2`. The clamp is mandatory; descriptions are instructor-authored and unbounded.
   - **Instructor**: `text-caption text-text-secondary mb-3`, name only, no avatar in v1.
   - **Action row**: `flex items-center justify-between`. Content varies by CTA state (§7).

**Card rules:**

- `bg-surface`, `border border-border-default`, `rounded-lg`, `overflow-hidden`.
- **No shadow at rest** (Flat-At-Rest Rule).
- The card is **not** a clickable surface in v1: it contains a button, and there is no detail route to navigate to. Therefore no `hover:shadow-hover-lift` and no image zoom; the only hover affordance is `hover:border-border-hover` with `transition-colors duration-fast`, matching the not-started dashboard card. If a detail route ships later, the card body (excluding the action row) may become a link and adopt hover-lift then.
- Prohibited on this card, permanently: price overlays, discount or "best seller" badges, star ratings, fake duration or lesson counts, countdown or urgency copy, enrollment counters.
- Status is never displayed: every course on this page is `PUBLISHED` by contract, so a status badge would be noise.

## 7. Enrollment CTA Behavior

The action row is the only part of the card that varies by viewer.

**Guest (not authenticated):**

- Single action: "Sign in to enroll", rendered as a Salem text-link (`text-caption font-medium text-salem`, hover `text-salem-400`, 44px hit area), navigating to `/login`. Whether it should pass a return-to-catalog redirect, and whether `/register` is the better target for first-time visitors, are open decisions (§11). Until decided, plain navigation to `/login` is the safe default since `GuestRoute` already owns post-auth redirection away from auth pages.
- Do not pop modals, do not inline a login form.

**Authenticated, not enrolled:**

- `Button variant="secondary" size="sm"` labeled "Enroll", with `aria-label="Enroll in {course.title}"`.
- Secondary, not primary, is deliberate: the Forest Rule allows one primary button per view zone, and a grid of nine Salem-filled buttons would erase Salem's authority. The bordered secondary button keeps each card actionable without turning the grid into a wall of green.
- On click: call the existing `enrollInCourse(courseId)` from `src/api/enrollments.ts`. While in flight, use the Button's built-in `loading` state (spinner, disabled, `aria-busy`).
- **On success**: update local state so the card flips to the Enrolled state in place. Do not navigate away; the learner may want to enroll in several courses in one visit. The flipped card's "Continue" link is the path to `/dashboard/courses`.
- **On `409` (already enrolled)**: treat as stale local state, not an error. Re-fetch enrollments, let the card flip to Enrolled, no error toast, no red.
- **On `404`**: the course was unpublished between page load and click. Show the card-level error line "This course is no longer available." in `text-caption text-text-secondary` and disable the CTA. A full list re-fetch is acceptable but not required.
- **Other failures**: inline `text-caption` line "Enrollment failed. Try again." next to or below the button; the button returns to its idle state. No red panel, no toast system (none exists).
- Do not handle `401`/`403` manually; the shared Axios response interceptor already owns those (logout + `/login`, and `/unauthorized` respectively).

**Authenticated, enrolled:**

- Left side: `Badge variant="salem"` labeled "Enrolled" (the Badge component documents `salem` as the enrolled/active state variant).
- Right side: "Continue →" Salem text-link to `/dashboard/courses`, `aria-label="Continue {course.title}"`.

Never invent checkout, pricing, seat limits, or waitlist behavior. Enrollment is one POST.

## 8. Loading, Empty, and Error States

**Loading.** Skeleton grid in the established `Bone` idiom (see `DashboardPageSkeleton`): header bones (`h-7 w-36`, then `h-4 w-48`), a toolbar bone row, then six card skeletons in the same responsive grid, each `rounded-lg border border-border-default bg-surface overflow-hidden` containing an `aspect-video` bone and three text bones in a `p-4` body. Wrapper is `aria-hidden="true"`. No spinner; spinners are not the established page-level pattern.

**Empty (zero published courses).** Reuse `StatePanel` (or a thin catalog wrapper around it) spanning the content column:

- Title line: "No courses available yet"
- Body: "Published courses will appear here when instructors make them available."
- `StatePanel` currently takes a single message; rendering the title as a `text-body-sm font-medium text-text-primary` line above the secondary body line is an acceptable minimal extension, flagged here so it is a conscious change.

**Filtered-empty (search/filter matches nothing).** Keep the toolbar mounted so the visitor can recover. Below it, a single centered line: "No courses match your filters." in `text-body-sm text-text-muted py-10 text-center`. No panel, no border; this mirrors the My Courses filter-empty pattern.

**Error (catalog fetch failed).** `StatePanel` with message "We could not load the course catalog." and the built-in "Try again" action wired to re-fetch. Calm bordered panel, secondary ink, no red, no illustration.

A failure of the **enrollments** fetch (authenticated users only) must not take down the page: render the catalog normally with all cards in the not-enrolled state, per §2.

## 9. Accessibility Notes

- The search input must have a programmatic `<label>` ("Search courses"); `sr-only` is acceptable if the design keeps the toolbar visually minimal. Placeholder text is not a label.
- The category `FilterTabs` group already renders `role="group"` with `aria-pressed` per tab; pass a group `aria-label` of "Filter by category".
- Cards are **not** fully clickable because they contain interactive children. The only tab stops inside a card are the CTA (and the Continue link when enrolled).
- Every CTA carries a course-specific accessible name: "Enroll in {title}", "Continue {title}", "Sign in to enroll in {title}". A page of nine buttons all named "Enroll" fails screen-reader users.
- Announce async outcomes: the result region of a card (success flip, error line) should be a polite live region (`aria-live="polite"`), and the catalog-level error panel should be discoverable on load (`role="status"` or equivalent). The Button primitive already announces its loading state.
- The Enrolled state is communicated by badge text plus the Continue link, never by color alone (the Badge's `salem` tint is reinforcement, not the message).
- Keyboard focus must remain visible everywhere: the primitives already ship `focus-visible` Salem outlines; do not strip them. Interactive text-links keep the 44px minimum hit area used across the dashboard.
- Thumbnail images get empty `alt=""` when decorative (the title is adjacent text); gradient placeholders are `aria-hidden="true"`.
- All transitions go through `motion-safe:` as in the existing card code, honoring `prefers-reduced-motion`.

## 10. Design-Rule Compliance Notes

- **Anti-marketplace mandate honored structurally**: the card template has no slot for price, rating, discount, urgency, or popularity. Removing the slots is stronger than a style rule.
- **Flat-At-Rest Rule**: no card shadow at rest; the catalog card is non-clickable in v1, so it never earns hover-lift, only border intensification.
- **The Forest Rule**: Salem appears only as the selected filter tab tint, the Enrolled badge tint, text-link actions, and focus rings. No Salem-filled button grid, no Salem backgrounds. Well under the 15% surface budget.
- **The Field Rule**: Coral and Anzac do not appear on this page at all. Nothing here is a warning or an achievement.
- **Register continuity**: marketing chrome (Navbar/Footer) frames a product-register content column (`text-title` header, `bg-bg-base`, quiet toolbar), which is exactly the bridge PRODUCT.md principle 3 asks for: arriving visitors see the same product they will enter after registering.
- **Single typeface, restrained scale**: Inter only; the page steps `text-title` → `text-body-sm` → `text-caption`, no in-between sizes, no display scale.
- **Three-tier depth max**: `bg-bg-base` (page) → `bg-surface` (cards, panels, input) → `bg-surface-elevated` (badge tint, tab hover). Nothing nests deeper.
- **No prohibited patterns**: no gradient text, no glassmorphism, no hero-metric grids, no accent side-stripes, no XP or leaderboard language, no Salem ambient backgrounds.
- **Identical-card-grid caution**: the grid is one card type by nature of the data, but variation comes from real thumbnails versus tonal placeholders, presence or absence of the category badge, and the three CTA states. If seed data makes the grid monotonous, that is a content problem, not a license to add decoration.
- **No invented tokens**: every class above exists in `tokens.css` or in committed component code; the two flagged judgment calls (StatePanel title line in §8, navbar solid variant in §1) are called out rather than silently assumed.

## 11. Open Decisions

1. **Route `/courses` vs `/catalog`**: resolved by existing code; the navbar and landing CTA already point to `/courses`. Choosing `/catalog` would require touching committed marketing components for no gain. Decision: `/courses`.
2. **Course detail page in v1**: the backend `GET /api/v1/courses/{courseId}` exists, but no route or page does. The catalog card's clamped description may be too little for a real enrollment decision. Recommendation: ship the catalog first, add `/courses/:courseId` as a fast follow; the card spec already defines how it upgrades (clickable body, hover-lift) when the route exists.
3. **Client-side search/filtering until backend search exists**: recommended yes. The published course count is small; refetching for every keystroke would be theater. Revisit when pagination lands (decision 7).
4. **Unauthenticated CTA target, `/login` vs `/register`**: default `/login` (returning users are the common case, and the login page links to registration). Whether to pass a post-auth redirect back to the catalog is part of the same decision; nothing in the current auth flow supports redirect-back yet.
5. **Enrolled courses showing "Continue"**: recommended yes when authenticated, since `getMyEnrollments()` already exists and the lookup is one fetch. If the team prefers a guest-identical page for v1 simplicity, every card shows "Enroll" and the `409` path silently flips state; acceptable but worse.
6. **Thumbnail placeholders until media upload exists**: recommended yes. `thumbnailUrl` is null today for all seeded data; the `gradientForId` tonal placeholder is already the established dashboard idiom and keeps the grid coherent without fake stock imagery.
7. **Pagination before large seed data**: not needed for v1 volumes, but the backend list endpoint is unbounded, so this becomes a real requirement before any open-registration launch. When backend pagination ships, move search and category filtering server-side in the same change rather than mixing client and server refinement.
8. **Level filter control**: the DTO supports it; v1 ships level as card metadata only. Add a level `FilterTabs` row or select only if real catalog volume shows learners need it.
