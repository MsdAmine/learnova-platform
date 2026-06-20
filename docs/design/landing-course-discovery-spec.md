# Learnova Landing Page → Course Discovery Redesign Specification

> **No-implementation spec.** This document defines a redesign of the public landing page (`/`) so it becomes Learnova's primary course-discovery surface. It does not modify frontend or backend source code, and it does not modify `docs/design/final-specs/landing-page.md` or `docs/design/landing-page/sections-notes.md` (those describe the *current* marketing-template landing page and remain as historical reference).
>
> **Canonical design system:** `DESIGN.md` at the project root. Every token referenced below already exists in `DESIGN.md` / `tokens.css` and is in active use in `Navbar.tsx`, `Hero.tsx`, `CourseCatalogPage.tsx`, `CourseCatalogCard.tsx`, `Button.tsx`, `Badge.tsx`, `Input.tsx`, `StatePanel.tsx`, `Bone.tsx`. Nothing here invents a new token.
>
> **Sibling specs:** `docs/design/page-specs/course-catalog-page.md` (the page this redesign routes into) and `docs/design/page-specs/course-detail-page.md` (the page the catalog routes into). Read both before implementing; this spec assumes their contracts (route, DTO shape, CTA states) are unchanged.
>
> **Inspiration boundary:** "broad structure of modern marketplaces" means hero-first search, category shortcuts, and content sections as an *information-architecture pattern*. It does not mean adopting Fiverr's visual identity, copy voice, gig/freelancer language, star ratings, seller branding, or layout chrome. Every visual decision below stays inside `DESIGN.md`'s calm-educational-SaaS register and PRODUCT.md's anti-references (Udemy bazaar styling is explicitly out, and so is anything that reads as a marketplace).

---

## 1. Current-State Analysis

### 1.1 What exists today

- **`/` (LandingPage.tsx)** renders a template marketing page: `Navbar` → `Hero` → `BrandIntro` → `Journey` → `StatsGrid` → `Testimonials` → `FinalCta` → `Footer`. It is built from `docs/design/final-specs/landing-page.md`, a generic SaaS-marketing spec (hardcoded stats like "12,000+ learners", placeholder testimonials with fictional company names "Webflow"/"Relume", a 3-step "Learning Journey" explainer). None of this is course-discovery; it is brand storytelling.
- **`/courses` (CourseCatalogPage.tsx)** is the actual discovery surface today: header, client-side search `Input`, category `FilterTabs`, and a responsive grid of `CourseCatalogCard`. It already does real work — search, filter, enroll, empty/error/loading states — but a visitor only reaches it by clicking "Browse courses" in the hero or "Course catalog" in the navbar. Nothing on `/` previews real courses or categories.
- **`/courses/:courseId`** is the public detail page, reached only from a catalog card's title link.
- The **Hero** (`Hero.tsx`) has two CTAs — "Get started" (`/register`) and "Browse courses" (`/courses`) — and a static headline/body. There is no search input anywhere on `/`.
- **Categories** (`getCategories()` in `api/categories.ts`) are fetched today only inside `InstructorCoursesPage`'s course-creation form. The public side never calls this endpoint; `CourseCatalogPage` derives its category tabs from the courses it already fetched, not from `/api/v1/categories`.

### 1.2 Why `/` is weak as a discovery entry point

- **No search affordance above the fold.** A visitor who already knows what they want (the PRD's working-professional persona, who "needs to find the right course fast") has to read past a full-bleed hero, scroll past a feature grid, a 3-step journey, a stats block, and testimonials before reaching anything resembling a course list — and even then, only by clicking through to `/courses`.
- **No real course or category content on the page that converts attention.** `StatsGrid` and `Testimonials` are fabricated numbers and fictional names. PRODUCT.md's own anti-reference list and DESIGN.md's "no fake stats," "no hero-metric template," and "no fictional testimonials" rules are already being violated by the current shipped page — this redesign is also a compliance fix, not just a UX upgrade.
- **The CTA priority is backwards for a discovery-first product.** "Get started" (register) is the primary button; "Browse courses" is a secondary ghost link. For a platform whose stated success metric is "a learner enrolls in a course," the primary action on the homepage should be finding a course, not creating an account in the abstract.
- **Category and course-catalog data is invisible until `/courses`.** A visitor cannot see "Development," "Design," whatever real categories exist, or a single real course title without leaving the landing page.

### 1.3 What moves from `/courses` onto `/`

Nothing about `/courses`'s *responsibility* moves — it remains the full search/browse/filter/enroll surface. What moves to `/` is a **preview layer** built from the same data sources it already uses:

- A **search entry point** (new on `/`, not previously anywhere on the landing page) that hands off to `/courses` with a query.
- A **small, real sample of published courses** ("recently added," not "featured" — see §3.2) sourced from the same `GET /api/v1/courses` the catalog page already calls.
- **Real category names** as clickable shortcuts, sourced from `GET /api/v1/categories` (a call the public side has never made before, but the endpoint is already public and already used elsewhere).

### 1.4 What stays on `/courses`

- The full, unfiltered list of all published courses.
- The actual search input and category `FilterTabs` toolbar (the landing page's search is a *launcher*, not a duplicate implementation — see §2.2).
- All enrollment CTA logic (guest/not-enrolled/enrolled states, 409/404 handling) — this redesign does not touch `CourseCatalogPage.tsx` or `CourseCatalogCard.tsx` beyond the URL-param read described in §2.3.
- Level metadata display and any future pagination/sort controls.

---

## 2. Information Architecture

### 2.1 Final public routes (no change to existing routing table)

| Route | Purpose | Guard |
|---|---|---|
| `/` | **Redesigned.** Course-discovery landing page: hero search, category shortcuts, recently-added courses, category groups, platform-capability strip, instructor CTA, footer. | None (public) |
| `/courses` | **Unchanged.** Full catalog: search + category filter toolbar, full course grid, enrollment CTAs. | None (public) |
| `/courses/:courseId` | **Unchanged.** Public course detail page. | None (public) |

No new routes are introduced. `router/index.tsx` requires no structural change — only the `LandingPage` component's internal composition changes (§5).

### 2.2 Hero search → catalog navigation

The landing-page hero search is a **launcher, not a second search implementation**. On submit, it performs a client-side route navigation (`useNavigate()` from `react-router-dom`) to:

```
/courses?q=<encoded query>
```

It does not call any API itself and does not render results inline (no autocomplete in v1, per the brief). `CourseCatalogPage` becomes responsible for reading `q` from the URL on mount and seeding its existing `query` state (§2.3) — the actual filtering logic in `CourseCatalogPage` is untouched.

### 2.3 Category chip → catalog navigation

A category shortcut (chip or card) routes to:

```
/courses?category=<encoded category name>
```

Both params can combine (`/courses?q=react&category=Development`), though v1 UI surfaces only land on one or the other (a search submit sets `q` only; a category chip sets `category` only).

### 2.4 URL query-param contract (new — `/courses` does not read query params today)

**Current state:** `CourseCatalogPage.tsx` holds `query` and `category` purely as local `useState`, initialized to `''` and `'All'`. It never reads `useSearchParams()`. This means a `?q=` or `?category=` link from `/` would land on the catalog with the right course list rendered (everything), but the search box and category tab would not reflect the deep link, and the rest of the unfiltered grid would still render — the only thing the URL params would currently do is nothing.

**Required minimal change (Phase 1, in scope — see §6):** `CourseCatalogPage` must initialize its existing `query` and `category` state from `useSearchParams()` on mount:

- `?q=<text>` → seeds the existing `query` state (case-insensitive substring match against title/description/instructor — already implemented, unchanged).
- `?category=<name>` → seeds the existing `category` state **only if the value exactly matches one of the categories derived from the fetched course list** (the same `categories` memo that already exists); otherwise falls back to `'All'` silently (no error state — a stale or mistyped category in a shared URL should degrade to "show everything," not break the page).
- Both params are optional and independent; either, both, or neither may be present.
- This is a **read-once-on-mount** seed, not two-way URL sync. The catalog's own `Input`/`FilterTabs` interactions continue to update only local state in v1 (no `setSearchParams` calls), since two-way sync is unrelated to the discovery-redesign goal and would expand this task's surface unnecessarily. If two-way sync (shareable filtered URLs from the catalog itself) is wanted later, it is a separate, small follow-up.

This is the only `CourseCatalogPage.tsx` change this spec requires. Everything else about that page (toolbar, grid, card, states) is reused as-is.

---

## 3. Data Strategy

### 3.1 Available data today

| Need | Source | Status |
|---|---|---|
| Course list | `GET /api/v1/courses` → `getPublishedCourses()` (`api/courses.ts`) | Exists, public, already used by `/courses` |
| Categories | `GET /api/v1/categories` → `getCategories()` (`api/categories.ts`) | Exists, public, currently only called from the instructor course form — **net-new consumer**, not a net-new endpoint |
| Course thumbnail | `course.thumbnailUrl` (`CourseCatalogItem`) | Plain URL string field; holds Cloudinary-hosted URLs when an instructor has set one (per ADR 0003), null otherwise. No upload widget exists — instructors paste a URL. The landing page must use the exact same `<img>` + `gradientForId` fallback pattern as `CourseCatalogCard` (§5.4); it must not assume every course has a thumbnail. |
| "Featured" / curation flag | None | **Does not exist.** No `isFeatured`, no admin curation UI, no backend field. |
| Category course counts | None as a dedicated field | **Derivable client-side** from the already-fetched course list (`categoryName` field), not from a backend count endpoint. |
| Grouped-by-category course list | None as a dedicated endpoint | **Derivable client-side** by fetching the full course list once and grouping it locally. |

### 3.2 v1 is frontend-only — no backend changes required

Every section in this redesign is achievable using only the two existing public endpoints above:

- **"Recently added courses" section** (this spec deliberately avoids the word "Featured" — see §8): fetch `getPublishedCourses()`, sort client-side by `createdAt` descending, take the first 6. This is an honest, real signal ("newest published"), not a fabricated editorial curation. There is no backend `isFeatured` flag to lie about having used.
- **"Browse by category" section**: fetch `getCategories()` for the list of real category names (and ids, for stable keys), then group the already-fetched course list by `categoryName` client-side. A category with zero published courses today is simply omitted from the grouped section (§7's empty-state rule), not rendered with a fake "0 courses" badge.
- **Category shortcut chips**: same `getCategories()` call, reused. Each chip shows the category name only — **no count badge in v1** unless the count is computed from real, already-fetched data, and even then it should be optional and unobtrusive (a small parenthetical, never a stat-grid number). See §8 decision on counts.
- **Hero search**: no data call at all — it is pure navigation (§2.2).

### 3.3 What would need a backend change (deferred, not in v1)

| If wanted later | Backend change required |
|---|---|
| True editorial "Featured" courses (admin-curated, independent of recency) | New `isFeatured: boolean` field on `Course` + admin UI to set it, or an admin-curated ordered list endpoint. |
| Category course counts at scale (avoiding a full-list fetch as the catalog grows) | A `GET /api/v1/categories` response enriched with `courseCount`, or a dedicated `GET /api/v1/courses/grouped-by-category` endpoint. |
| Server-side "courses grouped by category" pagination | A dedicated grouped/paginated endpoint; today's client-side grouping fetches the entire published list, which is fine at current seed-data scale (per the catalog spec's own §11 decision 3) but will need revisiting before open registration, same caveat the catalog spec already raises. |
| Search suggestions / autocomplete | A backend search/suggest endpoint; v1 explicitly excludes this. |

**No fake data rule:** nowhere in this spec does a hardcoded course list, hardcoded category list, hardcoded count, hardcoded rating, or hardcoded testimonial appear, except the explicit, clearly-labeled **empty-state fallback copy** in §7 (which is UI copy for the zero-data case, not fake data presented as real).

---

## 4. Section-by-Section UX Layout

Eight sections, vertical stack, mounted at `/` in place of the current `LandingPage.tsx` body. All sections live under a new `src/components/marketing/landing/discovery/` directory (or directly alongside the existing `marketing/landing/` components — naming convention is an implementation detail) so the deprecated template components (`BrandIntro`, `Journey`, `StatsGrid`, `Testimonials`, `FinalCta`) can be cleanly retired without touching unrelated marketing code.

### 4.1 Header / Nav

- **Purpose:** consistent wayfinding across the whole public surface; unchanged responsibility from today.
- **Content:** reuse `Navbar.tsx` exactly as it exists — logo, "Course catalog" / "How it works" / "About" links, Login button, mobile panel. No changes required. The `forceSolid` prop is **not** used here (the hero below is still a Salem full-bleed band, so the existing transparent-at-top → solid-on-scroll behavior is correct and unchanged).
- **Data source:** none (static nav).
- **Interaction:** unchanged — existing scroll-detection logic in `Navbar.tsx` already handles the transition once `#hero-section` (or `#brand-intro-section`) scrolls past. The new hero section must keep `id="hero-section"` so this keeps working without modification to `Navbar.tsx`.
- **Empty/loading/error:** N/A (static).
- **Responsive:** unchanged (already specified and implemented).
- **Accessibility:** unchanged (already implemented: focus trap, Escape-to-close, `aria-expanded`, etc.).

### 4.2 Hero / Search Area

- **Purpose:** the page's single loudest element, and the primary discovery action. Replaces the current generic "Learn what matters to you" / "Get started" hero with a search-first hero.
- **Content:**
  - `text-display` H1 (56px/700, one per page, unchanged token from DESIGN.md): a course-discovery-oriented headline. Recommendation: **"Find the course that moves you forward."** (Avoids "matters to you" vagueness; states the discovery action directly. Exact copy is a content decision, not load-bearing for this spec — any headline naming "find/learn/courses" satisfies the brief's "headline about learning/courses" requirement.)
  - `text-body-lg` supporting line, white 85% opacity, max-width ~560px: one sentence naming what the platform actually offers (structured courses, real progress tracking) — no "12,000+ learners," no manufactured urgency.
  - **Search form** (semantic `<form>`, see §9): one `Input` (reusing the existing `ui/Input.tsx` primitive, white/inverted treatment for the Salem background — see §10 for the on-dark input styling note) + one submit `Button variant="inverted"`. Placeholder: "Search courses, topics, or instructors" (matches what `CourseCatalogPage`'s search actually filters: title, description, instructor name — never promise something the catalog can't deliver).
  - **Category/search suggestion chips** directly below the search bar: 4–6 real category names (from `getCategories()`), rendered as small inverted-ghost pill links. These are the "suggestion chips" from the brief — not fake trending-search terms, real category names a click can resolve to.
  - **Primary CTA = the search form itself** (submitting it is the primary action; there is no separate "Explore" button competing with it — the Forest Rule's "one primary action per zone" is satisfied by the search submit button being the only filled button in the hero).
  - **Secondary CTA (optional, smaller, below or beside the chips):** "Become an instructor" as a quiet inverted-ghost text link to... no instructor-application route exists publicly today (instructor application lives inside `SettingsPage`, which is authenticated). v1 behavior: link to `/register` with the chip/link copy framed as "Want to teach? Create an account to apply." This avoids inventing a public instructor-landing route that doesn't exist. (Flagged as an open decision in §11 if a dedicated public instructor page is wanted later.)
  - Salem full-bleed background is retained (this is the one place DESIGN.md explicitly permits a Salem full-bleed section — "the full-bleed hero section on the marketing landing page").
- **Data source:** `getCategories()` for the suggestion chips (graceful: if the call fails or returns empty, render the search bar alone with no chip row — never block the hero on this fetch).
- **Interaction:**
  - Submitting the form with non-empty trimmed text → `navigate('/courses?q=' + encodeURIComponent(trimmed))`.
  - Submitting with an empty/whitespace-only query → `navigate('/courses')` (no `q` param at all; an empty `?q=` is meaningless noise). This matches the intuitive "just take me to the catalog" behavior.
  - Clicking a category chip → `navigate('/courses?category=' + encodeURIComponent(name))`.
  - No inline results, no dropdown, no autocomplete in v1 (explicit brief constraint).
- **Empty/loading/error:** chips row simply doesn't render if `getCategories()` fails or returns `[]`; the search form itself has no async state (it only navigates).
- **Responsive:** desktop keeps the existing two-column hero grid (text left, image right) **or** simplifies to a single centered column now that a search bar is the focal element — recommendation: **drop the right-column hero image** in favor of a single centered column with the search bar as the clear visual anchor, since a marketplace-style discovery hero reads cleaner without a stock photo competing with the input for attention (also removes the now-unused `hero-collaboration.jpg` asset dependency). This is a content/layout simplification, not a contradiction of DESIGN.md (DESIGN.md describes the hero's *background and token usage*, not a mandatory two-column composition). Mobile: search input full-width, chips wrap and scroll horizontally if needed (same idiom as the catalog's category-tab overflow handling).
- **Accessibility:** see §9 (dedicated search-behavior + accessibility sections).

### 4.3 Category Shortcut Row

- **Purpose:** a second, slightly more visual pass at the same "jump straight to a category" action as the hero chips — for visitors who scrolled past the hero without using search.
- **Content:** a horizontal (desktop) / wrapping (mobile) row of category cards or pills, one per real category from `getCategories()`. Each card: category name only, optionally a quiet count derived from the already-fetched course list (see §8 — counts are an explicit open decision, default to omitting them in v1).
- **Data source:** `getCategories()` (same call as the hero, fetched once at the page level and passed down — do not call it twice).
- **Interaction:** each card/chip is a `<Link>` to `/courses?category=<name>`, not a `<button>` with an `onClick` navigate (semantic correctness: this is navigation, not an action with a side effect).
- **Empty/loading/error:** if categories haven't loaded yet, render nothing (no skeleton needed for a secondary navigation aid — it can simply appear once ready, no layout-shift-causing placeholder required since it sits between two sections that don't depend on it). If `getCategories()` returns `[]`, omit this entire section (no "no categories yet" message needed for a pure navigation shortcut — unlike the course sections, an empty nav row has no content obligation).
- **Responsive:** `flex flex-wrap gap-3` at all breakpoints; on mobile this naturally wraps to multiple lines without horizontal scroll, since these are short single-word-ish labels (unlike the catalog's `FilterTabs`, which needs the select fallback at >6 options — a wrapping flex row of cards has no such limit).
- **Accessibility:** each card has a clear accessible name ("Browse Development courses," not just "Development") via `aria-label`, consistent with the catalog card's per-course `aria-label` pattern.

### 4.4 Recently Added Courses ("Featured" in the brief — see naming decision in §8)

- **Purpose:** prove the platform has real content within the first scroll, using actual published courses.
- **Content:** up to 6 real `CourseCatalogItem`s, sorted by `createdAt` descending (client-side `.slice().sort(...).slice(0, 6)` over the same array `getPublishedCourses()` returns). Each rendered with a **light variant of the existing course-card visual language** — reuse `CourseCatalogCard`'s token mapping (thumbnail/`gradientForId`, category badge, level caption, title, description clamp, instructor) but **without the enrollment action row**, since this is a discovery preview, not the transactional catalog grid. Recommendation: extract the presentational half of `CourseCatalogCard` (thumbnail + body text, no action row) into a small shared `CoursePreviewCard` used by both this section and §4.5, rather than duplicating the markup — this is the one net-new shared component this redesign should introduce (see §6).
- **Title-as-link:** each card's title links to `/courses/:courseId` (same as the catalog card today), giving a real path to the detail page without needing the enrollment logic on the landing page itself.
- **Section header:** `text-headline` "Recently added courses" + a "View all courses →" link to `/courses`, right-aligned on desktop.
- **Data source:** `getPublishedCourses()`, fetched once at the landing-page level.
- **Interaction:** click title → course detail; click "View all" → `/courses`. No inline enroll button (avoids re-implementing the enroll/auth-state logic that already lives correctly in `CourseCatalogPage`/`CourseCatalogCard`; a discovery card whose job is "make you curious, then route you" does not need a transactional CTA).
- **Empty/loading/error states:**
  - **Loading:** a `Bone`-based skeleton row of 6 card placeholders (same idiom as `CatalogSkeleton`), `aria-hidden="true"`.
  - **Empty (zero published courses platform-wide):** the entire section is **omitted**, not rendered with a "no courses yet" panel — a landing page with a half-empty discovery section reads as broken; a landing page that simply doesn't show a section it has nothing for reads as intentional. (This differs from `CourseCatalogPage`'s empty state, which *must* show a message because the visitor explicitly navigated there to see courses — the landing page didn't promise this specific section exists.)
  - **Error (fetch failed):** also **omit the section silently** rather than showing an error panel on the public marketing surface — degrade gracefully, the same fetch will succeed on `/courses` if the visitor continues there. A failed background fetch on a discovery preview is not worth alarming a first-time visitor with a "Try again" panel.
- **Responsive:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, same breakpoint pattern as the catalog grid, capped at 6 items (2 rows on `lg`).
- **Accessibility:** section landmark via `<section aria-labelledby="recent-courses-heading">`; each card's only interactive element is the title link (consistent with "no nested interactive elements" rule already enforced on the catalog card).

### 4.5 Courses by Category

- **Purpose:** let a visitor browse by subject without typing a search term, going one level deeper than the chip shortcuts (§4.3) by previewing actual courses inside each category, not just the category name.
- **Content:** for each real category (from `getCategories()`) that has **at least one** published course in the already-fetched list, render a sub-section: category name as `text-title-sm` heading + "View all →" link to `/courses?category=<name>`, followed by up to 3 `CoursePreviewCard`s (the same shared component from §4.4) for that category.
- **Cap:** show at most the **first 3 categories with content** (by category id order, or alphabetical — pick one deterministic order, not "most courses," which would require a secondary sort decision not worth the complexity for v1). Showing every category unconditionally risks a very long page once the catalog grows; 3 is a reasonable v1 ceiling and is explicitly **not a silent cap** — log/flag it in code comments as a v1 limitation, and the "View all courses" link in §4.4 plus the category chips in §4.3 already cover the remaining categories.
- **Data source:** `getCategories()` + the same `getPublishedCourses()` array, grouped client-side by `categoryName`. No second network call beyond the two already made for the page.
- **Interaction:** category heading link and "View all" link both go to `/courses?category=<name>`; each preview card's title links to `/courses/:courseId`, identical interaction pattern to §4.4.
- **Empty/loading/error:**
  - **Loading:** shares the same page-level loading gate as §4.4 (both sections depend on the same `getPublishedCourses()` call) — one skeleton state covers both, avoiding duplicate skeleton logic.
  - **Empty (no categories have any published courses, or `getCategories()` is empty):** omit the entire section, same rationale as §4.4.
  - **Error:** omit silently, same rationale as §4.4.
- **Responsive:** each category's 3-card row uses the same `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` pattern; category sub-sections stack vertically with `space-y-12` between them at all breakpoints (no side-by-side category columns — that would create a dense, scanning-heavy layout DESIGN.md's "Moodle density" anti-reference warns against).
- **Accessibility:** each category sub-section is its own `<section aria-labelledby>` with the category name as the heading text, preserving a clean `h2` → `h3` hierarchy if §4.4 is an `h2` and these are `h3`s (see §10 heading-order rule).

### 4.6 Platform Capability Strip

- **Purpose:** the "trust/product summary area" — an honest, restrained statement of what the platform actually does, replacing the current fabricated `StatsGrid` ("12,000+ learners") entirely.
- **Content:** a quiet 4-item row (not a stat grid — no big numbers, no gradient accents, explicitly prohibited by DESIGN.md's "hero-metric template" rule) naming real, shipped capabilities:
  - **Structured courses** — "Organized by category and skill level."
  - **Quizzes** — "Test what you've learned as you go." *(real: learner quiz-taking is end-to-end complete per CURRENT_STATE.md)*
  - **Certificates** — "Earn proof of completion." *(real: certificate issuance exists)*
  - **Progress tracking** — "Pick up exactly where you left off." *(real: per-lesson progress + enrollment progress percentage exist)*
  - Live sessions are **deliberately excluded from this strip in v1**: per CURRENT_STATE.md, `LiveSessionsPage` is a frontend placeholder with no backend — listing it here as a delivered capability would be a fake claim. (Re-add it once the live-sessions backend ships; tracked as a known gap, not a silent omission — see §11.)
- **Visual treatment:** four short text blocks (icon optional — a small Lucide icon per item is acceptable since icons already appear elsewhere in the codebase, e.g. `FeaturedCourseRow`'s `ArrowRight`; no illustration, no card shadow at rest, `bg-bg-base` or `surface-elevated` background, not Salem).
- **Data source:** none — this is static, honest platform copy, not a data-driven section. (Static copy describing real shipped features is not "fake data"; it is product description. The no-fake-data rule in §3.3 concerns metrics and counts, not capability descriptions.)
- **Interaction:** none required; optionally each item could link to its relevant dashboard area, but since this section is visible to guests who can't access the dashboard yet, plain non-interactive text blocks are the correct default.
- **Empty/loading/error:** N/A (static).
- **Responsive:** `grid-cols-2 lg:grid-cols-4` — two-column on mobile/tablet keeps each block readable without becoming a single long single-column list of four items.
- **Accessibility:** plain text content, no special handling beyond standard heading hierarchy for the section title ("What you get with Learnova" or similar, `h2`).

### 4.7 Instructor CTA

- **Purpose:** the secondary conversion path named in the brief — visible but clearly subordinate to course discovery.
- **Content:** a single, quiet two-line block: a short line ("Have expertise to share?") + one CTA. Given no public instructor-application route exists, the CTA target is `/register` (same resolution as the hero's secondary CTA in §4.2 — keep the copy and target consistent between the two instances so they don't read as two different offers).
- **Visual treatment:** a single-column or simple two-column (text + button) band, neutral background, **not** Salem full-bleed (reserve Salem for the hero only, per DESIGN.md's "no more than one Salem full-bleed section" implicit budget and the explicit "Salem occupies no more than 15% of any screen" rule applied at the page level).
- **Data source:** none.
- **Interaction:** one `Button variant="secondary"` or `"ghost"` (not primary — the page's primary action is search, established in the hero; this section must not introduce a second primary-weight button competing with that hierarchy) linking to `/register`.
- **Empty/loading/error:** N/A (static).
- **Responsive:** stacks to single column below `md`.
- **Accessibility:** standard link/button accessibility; no special handling.

### 4.8 Footer

- **Purpose:** unchanged — legal/navigation footer.
- **Content:** reuse `Footer.tsx` exactly as it exists today. **Do not** carry over the current footer's fabricated "Stay in the loop" newsletter subscribe form unless it already does something real on submit — check `Footer.tsx`'s current implementation before deciding; if it's a non-functional placeholder form, that is a pre-existing issue outside this spec's scope (this spec governs the *landing page body*, not the shared `Footer` component, which is reused by `/courses` and `/courses/:courseId` too — changing it here would change three pages at once and is explicitly out of scope).
- **Data source:** none (static).
- **Interaction:** unchanged.
- **Empty/loading/error:** N/A.
- **Responsive:** unchanged.
- **Accessibility:** unchanged.

---

## 5. Visual Design Rules (restating DESIGN.md constraints as applied to this page)

- **One Salem full-bleed section**: the hero only (§4.2). Every other section uses `bg-bg-base`, `bg-surface`, or `bg-surface-elevated` — the existing tonal-layering vocabulary, three tiers max.
- **No heavy gradients, no glassmorphism** anywhere on this page, including the hero (the hero's Salem background is a flat fill, not a gradient — this matches the *existing* `Hero.tsx` implementation, which already uses `bg-salem` flat, not a gradient; do not introduce one).
- **No flashy marketing effects**: no parallax, no auto-playing carousels for the recently-added or category sections, no scroll-jacking. Motion is limited to the existing fade/slide-up entrance pattern already implemented in `Hero.tsx` (reuse `prefersReduced`-gated stagger, do not invent a new animation system).
- **Course thumbnails**: Cloudinary URLs render via plain `<img>`, exactly like `CourseCatalogCard`; the `gradientForId(course.id)` deterministic tonal placeholder is the fallback for null/failed thumbnails — same utility, same visual ramp, reused not reinvented.
- **Category badges**: reuse `Badge variant="default"` exactly as the catalog card does; no new badge variant.
- **No fake ratings, durations, or certificate claims on any course preview card** — the `CoursePreviewCard` (§4.4/§4.5) carries the exact same field set as `CourseCatalogItem` allows and nothing more, mirroring the catalog card's "prohibited fields" list verbatim (no price, rating, duration, lesson count, enrollment count).
- **No XP/trophy/gamified language** anywhere, including the capability strip (§4.6) — "Earn proof of completion" describes the certificate feature plainly; it does not say "unlock," "achieve," or use trophy iconography.
- **No fake partner logos, no fictional testimonials** — the current `Testimonials.tsx` section (fictional "Webflow"/"Relume" logos, invented quotes) is **removed entirely** from `/`, not relocated. If real testimonials exist later, that is a separate, deliberately-scoped task with real customer consent, not a default inclusion here.
- **Certificates remain gold/neutral**: if the capability strip (§4.6) uses an icon for the certificate item, Anzac (`#E0C03A`) may tint that single icon (an "earned" context per DESIGN.md's Field Rule), but the surrounding text and layout stay neutral — Anzac must not bleed into the section background or other items.

---

## 6. Search Behavior

| Aspect | Behavior |
|---|---|
| **Input placeholder** | "Search courses, topics, or instructors" — matches the actual fields `CourseCatalogPage` filters against (title, description, instructorName); never promises category or level search via the text box (those are separate affordances). |
| **Submit behavior** | Form `onSubmit` (not a button `onClick` alone — must work via Enter key and via screen-reader form submission) calls `e.preventDefault()` then `navigate(...)` per §2.2/§2.3. |
| **Empty query behavior** | Submitting with a blank/whitespace-only input navigates to `/courses` with **no** `q` param (not `?q=`). Do not block submission or show a validation error for an empty search — "show me everything" is a valid, common intent. |
| **Keyboard behavior** | Standard `<form>`/`<input type="search">` semantics: Enter submits, Escape (native to `type="search"`) clears the field. No custom keyboard handling needed — avoid intercepting arrow keys or building custom keyboard nav since there is no dropdown/listbox to navigate (no autocomplete in v1). |
| **Mobile behavior** | Full-width input, submit button either inline (icon-only `Button` with an accessible name) or stacked below on very narrow viewports (390px) if an icon+label button doesn't fit on one line — verify at 390×844 (§13). |
| **Loading/error behavior (future suggestions)** | Not applicable in v1 — explicitly no autocomplete/suggestions. If added later, the loading state would be a `Bone`-based suggestion-list skeleton and errors would fail silently (degrade to "just submit the typed text"), consistent with this spec's general "discovery surfaces degrade quietly" pattern (§4.4/§4.5 error handling). |
| **Route/query-param behavior** | Defined fully in §2.4. |
| **No autocomplete in v1** | Confirmed — matches the brief explicitly. |

---

## 7. Accessibility Requirements

- **Semantic search form**: `<form role="search" aria-label="Search courses">` wrapping a labelled `<input type="search">` and a submit `<button type="submit">`. The label may be visually hidden (`sr-only`) if the placeholder communicates intent, consistent with the catalog page's existing `sr-only` label pattern for its search `Input`.
- **Labelled input**: explicit `<label htmlFor>` (visually hidden is acceptable), not a placeholder-only field — placeholder text is not a label, per the catalog spec's own accessibility note (§9 of `course-catalog-page.md`), reused here verbatim.
- **Submit button accessible name**: a visible "Search" label or an icon button with `aria-label="Search courses"` — never an icon with no accessible name.
- **Headings in correct order**: page-level `h1` is the hero headline (one per page, per DESIGN.md's typography rule). Section headers (§4.3–§4.7) are `h2`. Category sub-section headings inside §4.5 are `h3` (nested under the §4.5 `h2`). No skipped levels, no `h1` reused anywhere else on the page (the existing `Hero.tsx` already has exactly one `h1`; preserve that invariant when the headline copy changes).
- **Category chips/cards as links with clear names**: every chip/card is an `<a>`/`<Link>`, never a `<div onClick>`; each has an accessible name describing the destination ("Browse Development courses," not bare "Development") — same pattern already enforced on the catalog card's CTAs.
- **No color-only meaning**: the "Enrolled"-style badge pattern doesn't appear on this page (no enrollment CTAs live here per §4.4/§4.5's design decision), but category badges and any capability-strip icon tinting must still carry text labels alongside any color, consistent with DESIGN.md's blanket rule.
- **Focus-visible states**: every interactive element (search input, submit button, chips, card title links, capability-strip links if any, instructor CTA) keeps the existing `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2` Salem/white-ring pattern already used throughout `Navbar.tsx`/`CourseCatalogCard.tsx` — reuse the exact utility classes, do not invent new focus styling.
- **No horizontal overflow**: category chip rows must wrap (`flex-wrap`) rather than force horizontal scroll on narrow viewports, except where an explicit horizontal-scroll affordance is intentional and has visible scroll cues — v1 default is wrap, not scroll, for the landing page's chip rows (this differs from the catalog page's `FilterTabs`, which the catalog spec already allows to scroll horizontally as a fallback; the landing page's simpler chip set should just wrap).
- **Skeleton/loading states must not spam screen readers**: the §4.4/§4.5 shared loading skeleton is `aria-hidden="true"` end to end, exactly matching `CatalogSkeleton`'s existing pattern — no live-region announcements during the loading phase.
- **Test at 390×844, 768×1024, 1440×900**: see §13 (Testing Plan) for the explicit checklist; this requirement is restated here because accessibility (focus order, tap-target size, wrap behavior) must be verified at all three, not just visually inspected at desktop width.

---

## 8. Implementation Plan

### Phase 1 — Core discovery shell (no backend changes)

1. Route/page structure: no router changes needed (`/` already points to `LandingPage`); rewrite `LandingPage.tsx`'s composition to the new section list (§4), removing `BrandIntro`, `Journey`, `StatsGrid`, `Testimonials`, `FinalCta` imports.
2. New hero with search input + category chips (§4.2); hero search navigates to `/courses?q=...` (§2.2).
3. Category shortcut row (§4.3) from `getCategories()`.
4. Recently-added courses section (§4.4) from `getPublishedCourses()`, sorted client-side, capped at 6, using a new shared `CoursePreviewCard` (extracted presentational subset of `CourseCatalogCard`, no enroll action).
5. **Required `CourseCatalogPage.tsx` change** (small, in scope): read `?q=` / `?category=` via `useSearchParams()` on mount to seed existing `query`/`category` state (§2.4). This is the only existing-file change Phase 1 makes outside the landing page itself.
6. No backend changes.

### Phase 2 — Category grouping and resilience

1. Courses-by-category section (§4.5), grouping the same fetched list client-side, capped at 3 categories with content.
2. Improved empty/loading/error states per §4.4/§4.5's "omit silently" pattern, including the page-level loading gate shared by both course-driven sections.
3. Platform capability strip (§4.6) and instructor CTA (§4.7) — static, low-risk, can ship in either phase but grouped here since they have no data dependency and aren't blocking.
4. Optional backend support **only if** real-world course volume makes client-side grouping/sorting noticeably slow or the category list grows large enough that fetching the full course list on every landing-page load is wasteful — not needed at current seed-data scale (same caveat the catalog spec already raises for its own pagination question).

### Phase 3 — Analytics / search suggestions / recommendations

- **Only if backed by real data.** No fake personalization, no invented "Recommended for you" section without an actual recommendation signal (e.g., enrollment history, category affinity) backed by a real query. This phase is explicitly deferred and has no concrete scope until such a signal exists.

---

## 9. Testing Plan

```bash
cd frontend
npm run lint
npm run build
npm run test
```

**Browser QA viewports:**
- 390×844 (mobile)
- 768×1024 (tablet)
- 1440×900 (desktop)

**QA checklist:**
- [ ] Landing page (`/`) loads without console errors.
- [ ] Hero search with text → routes to `/courses?q=<text>` and the catalog's search input reflects the seeded value.
- [ ] Hero search with empty input → routes to `/courses` with no `q` param.
- [ ] Category chip (hero or shortcut row) → routes to `/courses?category=<name>` and the catalog's category tab/select reflects the seeded value.
- [ ] Recently-added courses section shows real, currently-published courses (verify against `/api/v1/courses` response, not placeholder data).
- [ ] No fake claims, stats, ratings, durations, or testimonials appear anywhere on the page.
- [ ] Cloudinary-hosted thumbnails render where `thumbnailUrl` is set; `gradientForId` placeholder renders where it is null or fails to load.
- [ ] Zero-course and zero-category states are honest (sections omit themselves per §4.4/§4.5, no broken-looking empty boxes).
- [ ] No horizontal overflow at any of the three tested viewports.
- [ ] Full keyboard navigation reaches and operates: search input, submit button, every chip/card link, capability-strip content, instructor CTA, footer — in a logical, visually-matching order.
- [ ] Focus-visible rings appear on every interactive element when tabbing (not just on mouse hover).
- [ ] No console errors or warnings introduced by the new sections.
- [ ] `CourseCatalogPage.tsx`'s existing behavior (search, filter, enroll, all states) is unaffected by the `useSearchParams()` seeding change — regression-check the catalog page directly, not just via the landing-page links.

---

## 10. Risks and Decisions

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Does the backend need a `isFeatured` flag? | **No, not for v1.** Use real recency (`createdAt` desc) instead and call the section "Recently added courses," not "Featured." | No curation UI or admin workflow exists to set a featured flag responsibly; shipping a flag with no way to manage it would just become a permanent "first N courses by id" with extra schema weight. Recency is an honest, zero-maintenance substitute. |
| 2 | Are category counts real or omitted? | **Omitted by default in v1.** If added, must be computed from the already-fetched course list (real), never hardcoded, and shown as a small unobtrusive parenthetical, never a stat-grid number. | The brief explicitly warns against "hardcoded fake category counts." Since no backend count endpoint exists, the only honest option is a client-side count from data already in memory — which is fine functionally, but the simplest and safest v1 default is to not show a number at all, since a category chip's job is navigation, not statistics. |
| 3 | Do the landing and catalog pages duplicate too much? | **No — they share data sources and a card component, not page logic.** The landing page is a curated *preview* (recency-sorted top 6, top 3 categories); the catalog page is the *complete, filterable* list. The shared `CoursePreviewCard` component (presentational only) is the one piece of intentional reuse; enrollment logic stays exclusively in `CourseCatalogCard`/`CourseCatalogPage`. | Avoiding duplication here means avoiding a second enroll-flow implementation, not avoiding two different *visual* card treatments for two different jobs (browse-to-decide vs. preview-to-explore). |
| 4 | How is fake marketing avoided going forward? | **Every data-bearing section has an explicit "omit, don't fabricate" empty-state rule** (§4.4, §4.5), and the capability strip (§4.6) lists only backend-verified shipped features, explicitly excluding live sessions pending its backend. | The current shipped landing page already violates PRODUCT.md's own anti-references (fake stats, fictional testimonials); this spec's empty-state philosophy (omit rather than fake) is the structural guardrail against repeating that mistake as the page evolves. |
| 5 | How does this stay report/demo-friendly? | Every section degrades gracefully with zero seed data (sections simply don't render rather than showing broken placeholders), and every section that *does* render with seed data shows real, verifiable values traceable to an actual API response — good for a PFA demo where the evaluator can cross-check the UI against the database. | A demo where "Recently added courses" shows 3 real seeded courses with real Cloudinary thumbnails is more credible to evaluate than one showing fabricated stats that don't correspond to anything in the database. |
| 6 | Should the hero keep its photo, or go single-column with just the search bar? | **Recommend dropping the hero photo** for a single centered search-first column (§4.2). | A discovery-first hero's job is to get a query typed, not to admire a stock photo; removing the image also removes the now-orphaned `hero-collaboration.jpg` asset dependency once this section replaces the current `Hero.tsx`. This is a recommendation, not a hard requirement — keeping a smaller supporting image is not a violation of any rule in this spec if a future implementer prefers it. |
| 7 | Where does the "Become an instructor" CTA point, given no public instructor-landing page exists? | **`/register`**, consistently between the hero's secondary CTA and the dedicated instructor-CTA section. | Building a new public instructor-marketing route is out of scope for a discovery-redesign task; `/register` is the only existing public entry point that leads toward instructor status (via the in-dashboard application flow already documented in CURRENT_STATE.md). |

---

## 11. Next Implementation Task (copy-paste for Phase 1)

```
Implement Phase 1 of the landing-page course-discovery redesign per
docs/design/landing-course-discovery-spec.md.

Scope:
1. Rewrite frontend/src/features/landing/pages/LandingPage.tsx to compose:
   Navbar -> Hero (search-first) -> CategoryShortcutRow -> RecentCourses -> Footer
   Remove BrandIntro, Journey, StatsGrid, Testimonials, FinalCta from this page
   (delete the now-unused component files only if nothing else imports them —
   grep first).

2. Rebuild frontend/src/components/marketing/landing/Hero.tsx (or a new
   sibling component) per spec section 4.2:
   - Salem full-bleed section, single h1 (text-display), supporting body-lg line
   - Semantic <form role="search" aria-label="Search courses"> with a labelled
     Input and a submit Button (inverted variant)
   - Submit: trim query; navigate to `/courses?q=<encoded>` if non-empty,
     `/courses` if empty
   - Category suggestion chips below the form, sourced from getCategories()
     (api/categories.ts), each linking to `/courses?category=<encoded name>`
   - Optional secondary "Become an instructor" link to /register
   - Respect prefers-reduced-motion using the existing pattern from the
     current Hero.tsx

3. Add a CategoryShortcutRow component (new) per spec section 4.3: a
   flex-wrap row of category links from getCategories(), each with an
   aria-label like "Browse {name} courses", routing to
   `/courses?category=<encoded name>`.

4. Add a CoursePreviewCard component (new, shared) by extracting the
   presentational half of CourseCatalogCard (thumbnail + gradientForId
   fallback + category badge + level + title-as-link + description clamp +
   instructor name) WITHOUT the enrollment action row. Use it from both the
   new RecentCourses section and (in Phase 2) the by-category section.

5. Add a RecentCourses section (new) per spec section 4.4: fetch
   getPublishedCourses() once, sort by createdAt descending, take the first 6,
   render via CoursePreviewCard in a grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
   layout, with a "View all courses" link to /courses. On fetch error or an
   empty result, omit the entire section (no error panel, no empty panel).
   Use a Bone-based skeleton (aria-hidden) while loading, matching the
   existing CatalogSkeleton idiom in CourseCatalogPage.tsx.

6. Modify frontend/src/features/catalog/pages/CourseCatalogPage.tsx: on
   mount, read `q` and `category` from useSearchParams() and seed the
   existing `query` and `category` state. If the URL's `category` value
   does not match any category derived from the fetched course list, fall
   back to 'All' silently. This is a read-once seed, not two-way URL sync —
   do not add setSearchParams calls to the existing toolbar handlers.

Constraints:
- No backend changes.
- No new routes (the router config is unchanged).
- Reuse existing tokens/components: Button, Badge, Input, Bone, gradientForId,
  Navbar, Footer. Do not invent new design tokens.
- No fake stats, ratings, durations, testimonials, or partner logos anywhere.
- Run, from frontend/: npm run lint, npm run build, npm run test — all must
  pass before considering Phase 1 done.
- Manually verify at 390x844, 768x1024, and 1440x900: hero search navigates
  correctly, category chips navigate correctly, recent courses render real
  data or the section is cleanly absent, no horizontal overflow, full
  keyboard navigation with visible focus rings.
```
