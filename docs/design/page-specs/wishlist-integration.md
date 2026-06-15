# Wishlist Integration UI & Interaction Specification

> No-implementation spec. This document defines the **frontend wishlist integration** across the public course catalog (`/courses`) and the public course detail page (`/courses/:courseId`). It is a documentation and design task only. Do not implement the React client, components, or pages from this document without a follow-up task. Do not modify backend code.
>
> Canonical design system: `DESIGN.md`. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use in `CourseCatalogPage.tsx`, `CourseCatalogCard.tsx`, `CourseDetailPage.tsx`, `StatePanel.tsx`, `Badge.tsx`, and `Button.tsx`. Where a role has no defined token, it is flagged as a design decision, not invented.
>
> Sibling specs (read first for shared conventions): `docs/design/page-specs/course-catalog-page.md` and `docs/design/page-specs/course-detail-page.md`. This spec adds a **secondary "save for later" affordance** to surfaces those specs already define; it does not redefine their layout, enrollment CTAs, or render states.

---

## 0. Scope & Assumptions

This spec covers the **wishlist (save-for-later) affordance** that lets authenticated learners save a public course to revisit later. It is additive: it layers a quiet secondary action onto the existing catalog card and the existing course-detail side panel.

**Clarifications (treat as fixed constraints):**

- Wishlist is for **authenticated learners only**. Guests can browse public courses but cannot call wishlist endpoints.
- **Wishlist is not enrollment.** Saving does not enroll the learner, does not create an `Enrollment`, and does not change `progressPercentage`.
- **Wishlist does not unlock protected content.** A saved course is still gated by the enrollment check at `/dashboard/courses/:courseId` and the content APIs; saving grants no access.
- **Wishlist does not replace the enroll CTA.** The primary action on each surface remains "Enroll" / "Continue learning" / "Sign in to enroll". The save action is always **secondary and visually quieter** than enrollment.
- This task covers **catalog/detail wishlist affordances** and the supporting API client + state model. A dedicated saved-courses page is an open decision (§9), **not** part of v1.
- This is **Product UI**, not marketing UI: restraint over ceremony, no social-favorite theatrics.

**Verified in the repo (do not re-derive, do not re-invent):**

- `WishlistController` (`backend/.../course/controller/WishlistController.java`) exists at base path `/api/v1/wishlist` and is annotated `@PreAuthorize("hasRole('LEARNER')")` — locked to the learner role for the whole controller.
- Backend behavior is verified in `CourseService.addCourseToWishlist`, `removeCourseFromWishlist`, and `getLearnerWishlist` (see §1).
- The frontend has **no wishlist client and no wishlist UI today**. There is no `src/api/wishlist.ts`. `CourseCatalogPage`, `CourseCatalogCard`, and `CourseDetailPage` reference enrollment only.
- `useAuth()` (`src/context/AuthContext.tsx`) exposes `isAuthenticated` (`!!token`) and `user: { roles: string[]; ... } | null`. Roles are strings like `ROLE_LEARNER`, `ROLE_INSTRUCTOR`, `ROLE_ADMIN`.
- UI primitives in use: `Button` (variants `primary | secondary | ghost | inverted | destructive`, sizes `sm | md | lg`, `loading`, `asChild`), `Badge` (variants `default | salem | coral | anzac | azure`), `StatePanel`, `Bone`.

**Out of scope:** the React implementation; backend changes; a dedicated saved-courses route/page; bulk save; sorting/filtering the wishlist; notifications or "price drop" style alerts (Learnova v1 is free — no price exists).

---

## 1. Backend Contract

Inspected directly from `WishlistController` and `CourseService`. **Do not invent endpoints.** There are exactly three, all under `/api/v1/wishlist`, all requiring `hasRole('LEARNER')`.

### 1.1 List my wishlist

```
GET /api/v1/wishlist?page={n}&size={n}
Auth: hasRole('LEARNER')
```

- **Returns 200** with a **Spring `Page<CourseResponse>`**, *not* a flat array. Default paging is `page=0, size=10` (`@PageableDefault(size = 10)`).
- **JSON shape** (Spring `PageImpl` serialization — the frontend must read `.content`, not treat the body as an array):

```jsonc
{
  "content": [ /* CourseResponse[] */ ],
  "totalElements": 12,
  "totalPages": 2,
  "number": 0,          // current page index
  "size": 10,
  "first": true,
  "last": false,
  "numberOfElements": 10,
  "empty": false
  // ...plus pageable/sort metadata which the frontend can ignore
}
```

- **`CourseResponse`** (verified field-for-field in `course/dto/CourseResponse.java` — note this is **richer** than the catalog's `CourseCatalogResponse`):

| Field | Type | Notes |
|---|---|---|
| `id` | number (Long) | Course id. The key the frontend keys saved-state on. |
| `title` | string | |
| `description` | string | |
| `level` | `CourseLevel` enum string | `BEGINNER` / `INTERMEDIATE` / `ADVANCED` / `ALL_LEVELS`. |
| `status` | `CourseStatus` enum string | **Present here.** Wishlist read applies **no PUBLISHED filter**, so a saved course later archived still appears with its real status. |
| `thumbnailUrl` | string \| null | |
| `categoryId` | number \| null | Not present on `CourseCatalogResponse`. |
| `categoryName` | string \| null | |
| `instructorProfileId` | number \| null | Not present on `CourseCatalogResponse`. |
| `instructorName` | string | |
| `createdAt` | string (ISO instant) | |
| `updatedAt` | string (ISO instant) | Not present on `CourseCatalogResponse`. |

- **Important:** `getLearnerWishlist` maps each `WishlistItem.getCourse()` through `toResponse` with **no status filter**. The wishlist can therefore contain a course whose `status` is `DRAFT` or `ARCHIVED` (e.g. a course saved while published, then archived by its instructor). The catalog and detail surfaces, by contrast, only ever show `PUBLISHED` courses. This divergence is the basis of an open decision (§10).

### 1.2 Add a course to my wishlist

```
POST /api/v1/wishlist/course/{courseId}
Auth: hasRole('LEARNER')
Request body: none
```

Verified status codes (from `CourseService.addCourseToWishlist`):

| Result | Status | Cause |
|---|---|---|
| Success | **201 CREATED** | Empty body. A `WishlistItem` row is created. |
| Course missing | **404 NOT FOUND** | No course with that id (`"Target course context not found"`). |
| Already saved | **409 CONFLICT** | A wishlist row already exists for this learner+course (unique constraint `uk_learner_course_wishlist`). |
| No learner profile | **403 FORBIDDEN** | Authenticated user has no `LearnerProfile`. |
| Not a learner / unauthenticated | **401 / 403** | Controller-level `hasRole('LEARNER')` or no token. Interceptor-owned. |

### 1.3 Remove a course from my wishlist

```
DELETE /api/v1/wishlist/course/{courseId}
Auth: hasRole('LEARNER')
Request body: none
```

Verified status codes (from `CourseService.removeCourseFromWishlist`):

| Result | Status | Cause |
|---|---|---|
| Success | **204 NO CONTENT** | Empty body. The `WishlistItem` row is deleted. |
| Course missing | **404 NOT FOUND** | No course with that id (`"Target course context not found"`). |
| Not in wishlist | **404 NOT FOUND** | Course exists but no wishlist row for this learner (`"This course was not found inside your wishlist"`). |
| No learner profile | **403 FORBIDDEN** | Authenticated user has no `LearnerProfile`. |
| Not a learner / unauthenticated | **401 / 403** | Interceptor-owned. |

### 1.4 Per-course saved-status endpoint

**Does not exist.** There is no `GET /api/v1/wishlist/course/{courseId}` or boolean status endpoint. The frontend **must derive saved state from the list endpoint** (§2): fetch the wishlist once per surface load, build a `Set<courseId>` from `.content[].id`, and test membership.

> **Pagination consequence (must be handled, not ignored):** because the list endpoint defaults to `size=10`, a naive single-page fetch only learns about the first 10 saved courses. To derive saved-state reliably across the catalog, the frontend must either (a) request a large `size` (e.g. `?size=200`) — acceptable for v1's small seed volume — or (b) page through until `last === true`. v1 recommendation: request a single large page and **`log`/comment the cap** so it is a conscious choice, not a silent truncation. Revisit when real wishlist volume or backend pagination policy changes.

---

## 2. Frontend State Model

A net-new API client is required: `src/api/wishlist.ts`, using the shared Axios instance (never raw axios). Suggested types and calls:

```ts
import api from './axios';
import type { CourseLevel } from './courses';

// Mirrors backend CourseResponse (richer than CourseCatalogItem).
export interface WishlistCourse {
  id: number;
  title: string;
  description: string;
  level: CourseLevel;
  status: string;                 // 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' — wishlist is NOT status-filtered
  thumbnailUrl: string | null;
  categoryId: number | null;
  categoryName: string | null;
  instructorProfileId: number | null;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

// Minimal Spring Page shape; only the fields the frontend reads.
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Request a large page so the derived Set covers the whole catalog in v1.
export async function getMyWishlist(size = 200): Promise<Page<WishlistCourse>> {
  const { data } = await api.get<Page<WishlistCourse>>(`/api/v1/wishlist?size=${size}`);
  return data;
}

export async function addToWishlist(courseId: number): Promise<void> {
  await api.post(`/api/v1/wishlist/course/${courseId}`);
}

export async function removeFromWishlist(courseId: number): Promise<void> {
  await api.delete(`/api/v1/wishlist/course/${courseId}`);
}
```

**Per-surface UI state:**

| State | Type | Purpose |
|---|---|---|
| `savedIds` | `ReadonlySet<number>` | Derived from `getMyWishlist().content` on load. Membership = "Saved". Mirrors the `enrolledIds` pattern in `CourseCatalogPage`. |
| `wishlistLoading` | `boolean` | Saved-set fetch in flight. Must **not** block course rendering (§6). |
| `wishlistError` | `boolean` | Saved-set fetch failed. Degrade gracefully: render the resting "Save" action; the 409/404 stale paths (§5) reconcile. |
| `pendingId` | `number \| null` | The single course id whose add/remove mutation is in flight. Drives the per-row spinner/disabled state. One pending mutation at a time per surface is sufficient for v1. |
| `rowError` | per-course inline message | Calm inline error for a failed save/remove on a specific course. No toast system exists. |

**Guest state.** When `!isAuthenticated`, no wishlist fetch is issued and no `savedIds` exist. The save affordance is either hidden or rendered as a "Sign in to save" link per surface (§3, §4) — it must never call a wishlist endpoint.

**Eligibility gate.** The save action is shown only when `isAuthenticated && user?.roles?.includes('ROLE_LEARNER')`. Because the controller requires `hasRole('LEARNER')`, showing it to an authenticated non-learner (e.g. an admin-only account without `ROLE_LEARNER`) would produce a 403 → `/unauthorized` redirect on click — a jarring dead end. Gating on the role avoids rendering an action that cannot succeed.

---

## 3. Public Catalog Behavior (`/courses`)

The catalog already renders one `CourseCatalogCard` per published course. Its action row (`CourseCatalogCard.tsx`) currently holds: guest → "Sign in to enroll"; not-enrolled → "Enroll"; enrolled → "Enrolled" badge + "Continue →". The wishlist affordance, **if shown here**, must not disturb any of that.

**v1 recommendation: do NOT add a save action to catalog cards.** Keep the wishlist affordance on the **detail page only** (§4). Rationale: the card action row is already three-state and dense; adding a fourth control per card across a 3-up grid adds clutter and competes with the enroll CTA — the opposite of the restraint PRODUCT.md demands. The detail page is where a learner is actually deciding, and is the natural home for "save for later." Whether to add a catalog-card save action is recorded as open decision §10.1.

**If catalog cards do get a save action (deferred / opt-in):**

- **Authenticated learner:** fetch the saved-set once on page load (same lifecycle as `enrolledIds`); guests never fetch. Render a **restrained, iconless ghost text action** in the card action row — `Save` when not saved, `Saved` (with a subtle change of weight/tint, never color alone) when saved. It is a `Button variant="ghost" size="sm"` or a plain Salem text-link, visually quieter than the secondary "Enroll" button beside it.
- **Placement:** the card action row is `flex items-center justify-between`. Put enroll-related content on the left (as today) and the save text action on the right, or stack the save action below the enroll button. Do **not** make the whole card clickable, do **not** wrap the title link or the enroll button inside the save control, and do **not** displace the title→detail link.
- **Guest:** **hide** the save action on cards (recommended) to avoid clutter; offer "save" on the detail page instead. A "Sign in to save" link on every card is permitted but discouraged here.

**Do not use** on the catalog (whether or not the save action ships there):

- Heart icons / filled-heart toggles (no such icon is in the design system).
- Social-media favorite animations (pop, burst, fill sweeps).
- A grid of Salem-filled save buttons (violates the Forest Rule — Salem authority is reserved for one primary action per zone; the enroll button is already the louder action).

---

## 4. Course Detail Behavior (`/courses/:courseId`)

This is the **primary home for the wishlist action in v1.** The detail page's side action panel (`SideActionPanel` in `CourseDetailPage.tsx`) already owns the single **primary** enrollment action. The wishlist action is **secondary and quieter**, rendered **below** the primary action inside the same `<aside>` panel, separated by spacing — never above it, never competing with it.

The panel currently renders one of three primary states; the save action attaches to each as follows:

| Viewer state | Primary action (unchanged) | Wishlist affordance (added below) |
|---|---|---|
| **Guest** | "Sign in to enroll" → `/login` | Either **omit**, or a quiet text-link **"Sign in to save this course"** → `/login`. Recommendation: a single text-link; do not duplicate two sign-in CTAs. May be folded into the existing helper line. Never calls wishlist endpoints. |
| **Authenticated learner, not saved** | "Enroll in course" (primary) | **"Save for later"** — `Button variant="secondary" size="md"`, full-width to match, `aria-label="Save {course.title} for later"`. |
| **Authenticated learner, saved** | "Enroll in course" (primary, unchanged) | **"Saved for later"** state with an optional **"Remove"** action (`Button variant="ghost"` or text-link, `aria-label="Remove {course.title} from saved courses"`). The saved state is shown by text (and optionally a `Badge variant="default"` reading "Saved"), never color alone. |
| **Authenticated, enrolled** | "Continue learning" (primary) | Save action **still permitted** (open decision §10.6); v1 recommendation: keep "Save for later"/"Saved" available — enrollment and saving are independent. |

**State update after mutation:** on a successful add (201) or remove (204), update the local saved state **in place** — flip "Save for later" ↔ "Saved for later". Do not navigate, do not reload the page, do not move focus away from the panel.

**Must not conflict with:**

- The primary "Enroll in course" / "Continue learning" / "Sign in to enroll" action — the Forest Rule allows exactly one primary (Salem-filled) action per view zone. The save action is `secondary`/`ghost`, never `primary`.
- No nested interactive elements: the save button, the enroll button, and any links are siblings, never nested.

---

## 5. Error Behavior

All wishlist mutations reuse the verified `getHttpStatus(error)` helper pattern already in `CourseCatalogCard.tsx` / `CourseDetailPage.tsx`.

| Condition | Status | Handling |
|---|---|---|
| Unauthenticated / forbidden | **401 / 403** | **Do nothing manual.** The shared Axios response interceptor owns these (401 → logout + `/login`; 403 → `/unauthorized`). The eligibility gate (§2) should prevent a learner ever triggering a role-based 403 from the UI. |
| Course no longer available (add or remove) | **404** | Calm inline message next to the action: **"This course is no longer available."** in `text-body-sm text-text-secondary`, `role="alert"`. Disable the save action. Do not show a red panel. |
| Duplicate save | **409** | Treat as **stale state, not an error**: the course is already saved. Flip local state to "Saved", clear any pending/error, no red, no toast. Optionally re-fetch the wishlist to reconcile. |
| Remove a course already gone from the wishlist | **404** (`"…not found inside your wishlist"`) | Treat as **stale state**: flip local state to "not saved" (unsaved), no error surfaced. The user's intent (remove) is already satisfied. |
| Generic failure (500 / network) | — | Calm inline line **"Could not update your saved courses. Try again."** in `text-body-sm text-text-secondary`, `role="alert"`; return the action to its prior resting state. No toast system exists. |

> Note the asymmetry in how 404 is interpreted: a **404 on add** means the course vanished (surface "no longer available"); a **404 on remove** is ambiguous (course missing *or* not in the wishlist) but in both cases the safe, non-alarming resolution is to treat the course as unsaved. Document this so the implementer does not show a scary error for a remove that effectively succeeded.

---

## 6. Loading Behavior

- **Never block course rendering on wishlist state.** The course (catalog grid or detail header/body) renders from its own fetch; the saved-set fetch is independent and may resolve later.
- While `wishlistLoading` is true, the save action renders **disabled** (or a thin `Bone` in its place) and reconciles to "Save"/"Saved" when the saved-set resolves. The catalog/detail page-level loading skeletons (`CatalogSkeleton`, `DetailSkeleton`) are unchanged.
- The per-course mutation in flight (`pendingId === course.id`) uses the `Button` primitive's built-in `loading` state (spinner, disabled, `aria-busy`). No separate spinner component.
- If the saved-set fetch fails (`wishlistError`), render the resting "Save for later" action anyway; the 409 stale path (§5) catches the case where it was already saved.

---

## 7. Accessibility

- **Action names include the course title** (not color- or icon-only): `aria-label="Save {course.title} for later"`, `aria-label="Remove {course.title} from saved courses"`, and for guests `aria-label="Sign in to save {course.title}"`. A page of bare "Save" buttons fails screen-reader users — mirror the existing per-course `aria-label` convention on the enroll actions.
- **Visible saved state is text, not color alone.** "Save for later" vs "Saved for later" must differ in their visible label (and optionally weight or a "Saved" badge). The Salem tint, if any, is reinforcement only — satisfies PRODUCT.md principle 5 and the WCAG AA "never color alone" rule.
- **No nested interactive elements.** The save control is a standalone `<button>` (or `<Link>` for the guest sign-in case), never nested inside the enroll button, the title link, or the card.
- **No empty/hidden buttons for guests.** When the save action is hidden for guests, render *nothing* (not a hidden or disabled empty button). Guests get either a real "Sign in to save" link or no save affordance at all.
- **Focus states visible.** Reuse the primitives' `focus-visible` Salem outlines; do not strip them. Text-link save actions keep the 44px hit area used across the catalog/detail links; `Button` already enforces `min-h-[44px]`.
- **Announce async outcomes.** Wrap the save action's result region in a polite live region (`aria-live="polite"`, as the catalog card's action row already does) so the flip and inline errors are announced. Inline errors use `role="alert"`.
- **Keyboard reachable.** The save control is a real tab stop in the card action row / side panel, reachable and operable by keyboard like the enroll action.
- **Motion** through `motion-safe:` prefixes only, honoring `prefers-reduced-motion`. No favorite-style animation regardless.

---

## 8. Design Rules (compliance & prohibitions)

The wishlist affordance is Product-register restraint layered onto a Brand/Product bridge surface. It **must not** introduce any of the following (consistent with the catalog/detail specs and PRODUCT.md anti-references):

- **Prohibited components/treatments:** marketing hero visuals, `Stat`, `SectionHeader`, the marketing `Container` primitive, glassmorphism, gradient text, card shadows at rest, large Salem ambient backgrounds, social-media favorite animations.
- **Prohibited language:** price, rating, discount, "best seller", XP, trophy, or any achievement/gamification framing. Saving is a calm utility, not a reward.
- **The Forest Rule:** Salem appears only as the *single* primary action per zone (enrollment), plus text-link tints, badge tints, and focus rings. The save action is `secondary`/`ghost`; do not add a second Salem-filled button. No grid of Salem save buttons on the catalog.
- **The Field Rule:** Coral and Anzac do not appear — saving is neither a warning nor an achievement.
- **Flat-At-Rest:** the side panel remains the only bordered surface on the detail page; the save action adds no new card or shadow.
- **Three-tier depth max** and **single typeface, restrained scale** are unchanged; the save action introduces no new size or color token. Every class it uses already exists in `tokens.css` / committed components.

---

## 9. Optional Saved-Courses Surface

**Not required for v1.** The backend list endpoint (`GET /api/v1/wishlist`) exists, but **no dashboard route or page is designed for it**, and designing one is out of this task's scope.

- v1 delivers wishlist value from the catalog/detail affordances (save/unsave + saved-state reflection). Saved-list *discovery* (a place to browse everything you saved) is a deliberate follow-up.
- **If/when needed later:** create a separate page spec for `/dashboard/saved-courses` (a `ProtectedRoute` learner page under `DashboardLayout`), consuming the paginated list endpoint with real pagination, an empty state ("You haven't saved any courses yet"), and per-card "Remove" + "Enroll". That spec — not this one — would define its layout. Note the §1.4 pagination handling and the §10.7 archived-course visibility question apply there in full.

---

## 10. Open Decisions

| # | Decision | v1 recommendation | Notes / blocker |
|---|---|---|---|
| 1 | Show the save action on **catalog cards**, or detail page only? | **Detail page only in v1.** | Card action row is already three-state; a fourth control per card across a 3-up grid adds clutter. Catalog save is a clean fast-follow (§3 specifies it for when chosen). |
| 2 | For guests, **hide** the save action or show a **"Sign in to save"** link? | **Detail: one quiet "Sign in to save" text-link. Catalog (if shown): hide.** | Never call wishlist endpoints as a guest. Avoid two competing sign-in CTAs in the side panel. |
| 3 | Should saved courses get a **dashboard page**? | **Not in v1** (§9). | Backend list exists but no route/page is designed. A separate spec is required. |
| 4 | Should `/login` carry a **return redirect** back to `/courses/:courseId` after a guest clicks "Sign in to save"? | **Not in v1.** | Same blocker as the catalog/detail specs: `GuestRoute` redirects to `/` after auth; redirect-back is a separate auth-flow task. |
| 5 | Should the wishlist **sync after enrollment** (auto-remove a course from the wishlist when the learner enrolls)? | **No auto-remove in v1.** | The backend does nothing automatic here (enroll and wishlist are independent), and the frontend should not silently delete a saved row on enroll. If desired later, it is a backend behavior change, not a frontend trick. |
| 6 | Should **enrolled** courses still be **saveable**? | **Yes — keep save available.** | Enrollment and saving are independent backend concepts; the API does not forbid saving an enrolled course. Hiding it would be an arbitrary UI rule. |
| 7 | Wishlist read is **not status-filtered** — a saved course can be `ARCHIVED`/`DRAFT`. How should that surface? | **Out of scope for catalog/detail v1; handle in the saved-courses page spec.** | The catalog and detail pages only ever show `PUBLISHED` courses, so this divergence is invisible there. It only manifests on a future saved-courses list, which must decide whether to show, dim, or hide non-published saved courses. **Noted, not blocking v1.** |
| 8 | Deriving saved-state requires reading a **paginated** endpoint (§1.4). | **Request one large page (`?size=200`) in v1; comment the cap.** | Acceptable for small seed volume. Move to true paging / server-side membership check when volume grows or backend adds a per-course status endpoint. |

---

## 11. Implementation Readiness

**API client to add (net-new):**

- `src/api/wishlist.ts` — `getMyWishlist(size?)` (reads `Page<WishlistCourse>.content`), `addToWishlist(courseId)` (POST → 201), `removeFromWishlist(courseId)` (DELETE → 204). Uses the shared Axios instance. Reuse `CourseLevel` from `src/api/courses.ts`; add a minimal `Page<T>` type.

**Components / pages to touch:**

- `CourseDetailPage.tsx` — extend `SideActionPanel` with the secondary save affordance (Save for later / Saved for later + optional Remove / guest "Sign in to save"); add `savedIds`/saved-state, `pendingId`, `rowError`, and the eligibility gate; fetch the saved-set in a non-blocking effect alongside the existing enrollments effect.
- *(Deferred / open decision §10.1)* `CourseCatalogCard.tsx` + `CourseCatalogPage.tsx` — only if the catalog-card save action is approved; lift saved-set fetching to the page (mirroring `enrolledIds`).

**Route changes:** **none** for v1. (`/courses` and `/courses/:courseId` already exist and are unguarded. A future `/dashboard/saved-courses` route is out of scope — §9.)

**QA scenarios:**

1. Guest on detail page → sees "Sign in to save" link (or nothing); no wishlist network call is made.
2. Authenticated learner, not saved → "Save for later"; click → 201 → flips to "Saved for later" in place; primary enroll action unchanged.
3. Authenticated learner, saved → "Saved for later" + "Remove"; click Remove → 204 → flips back to "Save for later".
4. Click Save twice fast / already-saved elsewhere → 409 → treated as saved, no error.
5. Remove a course already gone from the wishlist → 404 → treated as unsaved, no error.
6. Save a course unpublished between load and click → 404 → "This course is no longer available." inline, action disabled.
7. Saved-set fetch fails → save action still renders ("Save for later"); 409 path reconciles on click; page content unaffected.
8. Network error on save/remove → calm inline "Could not update your saved courses. Try again."; action returns to resting state.
9. Authenticated **non-learner** (admin-only account without `ROLE_LEARNER`) → save action is **not rendered** (eligibility gate); no 403/`/unauthorized` bounce from the wishlist UI.
10. Keyboard-only: save/remove reachable and operable; focus ring visible; saved state announced via the polite live region; saved state distinguishable without color.
11. `prefers-reduced-motion`: no save animation; transitions degrade to instant.
