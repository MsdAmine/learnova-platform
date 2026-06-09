# My Courses Page — UI Layout Specification

## 0. Scope & Assumptions

This is a no-implementation visual layout plan for the **learner-dashboard `MyCoursesPage`** (`frontend/src/features/dashboard/pages/MyCoursesPage.tsx`) — the page that lists a learner's **enrolled** courses with their progress. It renders inside `DashboardLayout`'s `<main>` `<Outlet />` (the layout already owns the topbar, sidebar, and scroll container), so this spec covers **only the content column**, not a page chrome.

The current `MyCoursesPage.tsx` is a header-only stub. The full course-list patterns it should adopt **already exist as working, committed code** in the "My Courses" section of `LearnerDashboard.tsx` (`ProgressBar`, `InProgressCourseCard`, `CompletedCourseCard`, `NotStartedCourseCard`, `FeaturedCourseRow`, and the filter-tab group). This spec **formalizes those proven patterns** and promotes them into reusable pieces. Because every token below is taken verbatim from code that already compiles in the repo (`LearnerDashboard.tsx`, `DashboardLayout.tsx`, `tokens.css`), nothing here is invented; where a role has no defined token it is flagged as a design decision.

**Course state model** (from the existing `Course` interface — `{ id, title, instructor, progress, gradient }`):
- `progress === 0` → **Not started**
- `0 < progress < 100` → **In progress**
- `progress === 100` → **Completed**

## 1. Layout & Structure

The page is a single vertical content column inside `DashboardLayout > main`. Top-to-bottom:

1. **Page shell** — `<div className="px-8 py-8 pb-14 max-w-container mx-auto">`. This is the canonical dashboard page shell, identical across `MyCoursesPage`, `ProgressPage`, `CertificatesPage`. No `<Container>` primitive and no full-width marketing `<section>` bands — those belong to public/marketing pages, not the dashboard. (`mx-auto` matches `LearnerDashboard`; the current stubs omit it — adopt it so the column centers within the wide `main` area.)
2. **Page header** — `mb-8` block: `h1.text-title font-semibold text-text-primary` ("My Courses") + `p.text-body-sm text-text-secondary mt-1` (subtitle, e.g. "All your enrolled courses in one place."). This is the existing stub header, kept as-is.
3. **(Optional) Summary strip** — the inline, dot-separated metric line from `LearnerDashboard` (e.g. "5 courses enrolled · 2 completed · 18h learned"). Single line, `text-body-sm`; **not** the `Stat` primitive (see §3).
4. **Filter + toolbar row** — a `role="group"` tab cluster (`All` / `In Progress` / `Completed`) driven by an `aria-pressed` selected state. Optionally paired left with a section heading (`h2.text-title-sm`) when the list is grouped.
5. **Featured "Next up" row** *(optional, when an in-progress course is prioritized)* — `FeaturedCourseRow`: a full-width horizontal card with a left gradient strip, "Next up" eyebrow, title, instructor, a `Continue →` action, and a progress bar.
6. **Course grid** — `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start`, rendering one **state-specific card** per course (in-progress / completed / not-started). `items-start` keeps rows from stretching to the tallest card.
7. **Empty state** — when a filter matches nothing: a single centered line, `text-body-sm text-text-muted py-10 text-center` ("No courses match this filter.").

### Content-column wireframe (lg)

```
 px-8 py-8 pb-14 max-w-container mx-auto  (inside DashboardLayout > main)
┌────────────────────────────────────────────────────────────────────────────┐
│ My Courses                              (h1 · text-title / 600)             │
│ All your enrolled courses in one place. (text-body-sm · text-secondary)     │
│                                                                             │
│ 5 courses enrolled · 2 completed · 18h learned   (optional summary strip)   │
│                                                                             │
│ My Courses (h2 · title-sm)        [ All ][ In Progress ][ Completed ]  tabs │
│                                                                             │
│ ┌───┬────────────────────────────────────────────────┐  ← FeaturedRow      │
│ │▓▓▓│ Next up                                Continue →│    (border-hover)   │
│ │▓▓▓│ Advanced React Patterns · Sarah Chen             │                     │
│ │▓▓▓│ Progress                         68% complete    │                     │
│ │▓▓▓│ ▰▰▰▰▰▰▱▱▱▱  (h-1 salem on surface-elevated)      │                     │
│ └───┴────────────────────────────────────────────────┘                     │
│                                                                             │
│ grid-cols-1 sm:2 lg:3  gap-4  items-start                                   │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                          │
│ │ ▒▒ 16:9 ▒▒   │ │ Title    Done│ │ Title        │  ← in-progress | done |  │
│ │ Title        │ │ Instructor   │ │ Instructor   │    not-started cards     │
│ │ Instructor   │ └──────────────┘ │ Not started ▸│                          │
│ │ ▰▰▰▱▱ 35%    │   (anzac badge,  │   (text-only, │                          │
│ └──────────────┘    no thumbnail) └────no bar)────┘                          │
└────────────────────────────────────────────────────────────────────────────┘
```

### Responsive behavior table

| Breakpoint | Shell max-width | Course grid columns | Grid gap | Notable |
|---|---|---|---|---|
| base (< 640px) | `max-w-container` | 1 | `gap-4` | Sidebar is an off-canvas drawer (owned by `DashboardLayout`); featured-row gradient strip (`hidden sm:block`) is hidden |
| `sm` (640px) | `max-w-container` | 2 | `gap-4` | Featured-row gradient strip appears; summary strip stays single-line |
| `md` (768px) | `max-w-container` | 2 | `gap-4` | Sidebar becomes static (250px); content centers via `mx-auto` |
| `lg` (1024px+) | `max-w-container` | 3 | `gap-4` | Full 3-up grid |

> Horizontal padding is a flat `px-8` (32px) at every breakpoint in the current dashboard. Tightening it on mobile (`px-4 sm:px-8`) is a reasonable refinement but is **a design decision**, not an existing token-backed pattern.

### Vertical rhythm

- Header block: `mb-8`. Summary strip: `mb-8`. Each `<section>` (filter+grid, etc.): `mb-8`.
- Section heading → content: `mb-4`.
- Featured row → grid: `mb-4` on the featured row.
- Inside cards: content padding `p-4` (16px); title→instructor `mb-0.5`/`mb-1`; instructor→progress `mb-3`; progress bar→"% complete" caption `mt-1.5`.

## 2. Token Mapping

### Page shell & header

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Shell `<div>` | — | — | — | inherits `bg-bg-base` (from layout) | none | `px-8 py-8 pb-14`, `max-w-container mx-auto` |
| H1 "My Courses" | `text-title` | `font-semibold` (600) | `text-text-primary` | — | none | header block `mb-8` |
| Subtitle | `text-body-sm` | `400` | `text-text-secondary` | — | none | `mt-1` |

### Summary strip (optional)

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Strip wrapper | `text-body-sm` | `400` | `text-text-secondary` | — | none | `mb-8`, `gap-0` |
| Metric value | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `mr-1.5` |
| `·` separator | `text-body-sm` | `400` | `text-border-hover` | — | none | `mx-3` |

### Filter tab group

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Tab (base) | `text-body-sm` | `font-medium` (500) | — | — | `rounded-md` | `px-3 py-1.5`, group `gap-0.5` |
| Tab — selected | `text-body-sm` | `500` | `text-salem` | `bg-salem-50` | `rounded-md` | — |
| Tab — idle | `text-body-sm` | `500` | `text-text-secondary` → hover `text-text-primary` | hover `bg-surface-elevated` | `rounded-md` | `transition-colors duration-fast` |

### Section heading

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Group heading (h2) | `text-title-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `mb-4` |

### Progress bar (shared)

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Track | — | — | — | `bg-surface-elevated` | `rounded-full`, `overflow-hidden` | `h-1` |
| Fill | — | — | — | `bg-salem` | `rounded-full` | `h-full`, `width: {progress}%` |
| "% complete" caption | `text-caption` | `400` / `500` | `text-text-muted` / `text-text-secondary` | — | none | `mt-1.5` (card) |

### Course card — In progress

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border-border-default`, `rounded-lg`, `overflow-hidden` | `transition-shadow duration-standard hover:shadow-hover-lift` |
| Thumbnail | — | — | — | gradient (Salem ramp, `linear-gradient(140deg,…)`) | — | `aspect-video w-full` |
| Content | — | — | — | — | — | `p-4` |
| Title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-2 mb-0.5` |
| Instructor | `text-caption` | `400` | `text-text-secondary` | — | none | `mb-3` |
| Progress | (see Progress bar) | — | — | — | — | — |

### Course card — Completed

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border-border-default`, `rounded-lg` | `p-4` |
| Title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-2`, `mb-2` row |
| "Done" badge | `text-caption` | `font-medium` (500) | `text-anzac-700` | `bg-anzac-50` | `rounded-full` | `px-2 py-0.5` (= `Badge variant='anzac'`) |
| Instructor | `text-caption` | `400` | `text-text-secondary` | — | none | — |

### Course card — Not started

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border-border-default` → hover `border-border-hover`, `rounded-lg` | `p-4`, `transition-colors duration-fast` |
| Title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-2 mb-1` |
| Instructor | `text-caption` | `400` | `text-text-secondary` | — | none | `mb-3` |
| "Not started" label | `text-caption` | `400` | `text-text-muted` | — | none | — |
| "Start →" action | `text-caption` | `font-medium` (500) | `text-salem` → hover `text-salem-400` | — | none | `gap-1` |

### Featured "Next up" row (optional)

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border-border-hover`, `rounded-lg`, `overflow-hidden` | `mb-4` |
| Gradient strip | — | — | — | Salem-ramp gradient | — | `w-20 hidden sm:block` |
| "Next up" eyebrow | `text-caption` | `400` | `text-text-muted` | — | none | `mb-1` |
| Title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-1 mb-0.5` |
| Instructor | `text-caption` | `400` | `text-text-secondary` | — | none | — |
| "Continue →" action | `text-body-sm` | `font-medium` (500) | `text-salem` → hover `text-salem-400` | — | none | `gap-1` |
| Progress label / value | `text-caption` | `400` / `500` | `text-text-muted` / `text-text-secondary` | — | none | row `mb-1.5` |

### Empty state

| Element | Typography | Weight | Text color | Background/surface | Border/radius | Spacing |
|---|---|---|---|---|---|---|
| Empty message | `text-body-sm` | `400` | `text-text-muted` | — | none | `py-10 text-center` |

## 3. Component Reusability

The most important reusability move on this page is **not** pulling in the marketing UI primitives — it is **extracting the patterns `LearnerDashboard` already built** so the dashboard and this page share one source of truth instead of duplicating markup.

### Extract & reuse (currently local to `LearnerDashboard.tsx`)

| Pattern | Current location | Action | Role on My Courses page |
|---|---|---|---|
| `ProgressBar` | local fn in `LearnerDashboard.tsx` | **Extract → `components/ui/ProgressBar.tsx`** | Progress on in-progress cards + featured row; reused on `ProgressPage` later |
| `InProgressCourseCard` / `CompletedCourseCard` / `NotStartedCourseCard` | local fns | **Extract → e.g. `components/dashboard/CourseCard.tsx`** (single component switching on `progress`) | One card per enrolled course, state-driven |
| `FeaturedCourseRow` | local fn | **Extract → `components/dashboard/FeaturedCourseRow.tsx`** | Optional "Next up" row |
| Filter tab group | inline JSX | **Extract → small `SegmentedTabs`/`FilterTabs`** | All / In Progress / Completed switching |

### Existing UI primitives that fit

| Component | Path | Variant/Prop | Role on My Courses page |
|---|---|---|---|
| Button | `frontend/src/components/ui/Button.tsx` | `variant='primary' size='md'` (Continue on featured/detail); `variant='secondary' size='sm'` (secondary actions) | Primary "Continue" action; the per-card "Continue/Start →" links are lighter text-links by design, not Buttons |
| Badge | `frontend/src/components/ui/Badge.tsx` | `variant='anzac'` | The Completed "Done" pill — `bg-anzac-50 text-anzac-700` already **equals** `Badge variant='anzac'`; swap the hand-rolled span for it |
| Card | `frontend/src/components/ui/Card.tsx` | `variant='stat'` (`p-md`=16px) for completed/not-started; `variant='default' className='p-0 overflow-hidden'` + inner `p-4` for the thumbnail card | Can back the card shells — note the dashboard cards use `p-4`(16px), which matches `Card`'s `stat` variant, **not** its default `p-lg`(24px) |
| Avatar | `frontend/src/components/ui/Avatar.tsx` | `size={24}` | Optional: add an instructor avatar beside the instructor name (dashboard currently shows name as text only) |

### Does NOT fit

- **SectionHeader** (`SectionHeader.tsx`) — it is the **marketing** header primitive (renders `text-display`/`text-headline` with an eyebrow). The dashboard uses a lighter, distinct header (`h1.text-title` + `h2.text-title-sm`). Do not introduce `SectionHeader` here; it would break the dashboard's quieter hierarchy.
- **Stat** (`Stat.tsx`) — its values render at `text-headline` (40px) / `text-display` (56px), built for one hero metric per marketing section. The dashboard summary is a compact inline `text-body-sm` strip; `Stat` is the wrong scale for it. (`Stat` could anchor a future standalone metrics panel, but not this list page.)
- **TestimonialCard** (`TestimonialCard.tsx`) — social-proof composition (logo/quote/author); unrelated to an enrolled-course row.
- **Container** (`Container.tsx`) — the marketing width primitive; the dashboard shell uses inline `px-8 … max-w-container` instead, since `DashboardLayout` already governs the page frame.

## 4. Design-Rule Compliance Notes

- **Token-by-name, no invention** — every cell in §2 is a token already present in `tokens.css` / used by `LearnerDashboard.tsx`; the only flagged gap (mobile horizontal padding) is marked a design decision, not filled with a guess.
- **Flat-At-Rest Rule** — cards carry no shadow at rest; `shadow-hover-lift` appears only on the in-progress card hover (`transition-shadow duration-standard`), and the not-started card intensifies only its border (`border-default → border-hover`). No ambient/decorative shadows.
- **The Forest Rule (one primary per zone)** — at most one `Button variant='primary'` per surface (the "Continue" on the featured row); per-card actions are low-weight Salem text-links, and the selected filter tab is the single emphasized control in the toolbar.
- **Reserved Badge semantics** — Completed uses `Badge variant='anzac'` (achievement), never a neutral/`default` chip; Salem is reserved for the action/progress meaning.
- **Salem usage stays sparing & purposeful** — Salem appears as the progress-bar fill (sanctioned "progress" role in `tokens.css`), the active-tab tint (`bg-salem-50`), and text-link actions; large surfaces stay `bg-bg-base`/`bg-surface`, never a Salem background.
- **Three-tier depth max** — surfaces stay within `bg-bg-base` (page) > `bg-surface` (card) > `bg-surface-elevated` (progress track / tab hover); no deeper nesting.
- **Single typeface + restrained type scale** — Inter only; the page steps `text-title` (h1) → `text-title-sm` (section h2) → `text-body-sm` (titles/body) → `text-caption` (meta), with no in-between scale and no borrowing of `Stat`'s display sizes.
- **Don't build identical-card grids** — satisfied structurally: the list mixes a featured "Next up" row, gradient-thumbnail in-progress cards, badge-only completed cards, and text-only not-started cards, so the grid never reads as a monotonous repeat.
- **Dashboard ≠ marketing chrome** — the page reuses the shared dashboard shell/header pattern and stays inside `DashboardLayout`'s frame; it deliberately avoids `Container`/`SectionHeader`/`Stat`, keeping the app side visually distinct from the public/marketing pages.
- **Accessibility carried from the source patterns** — progress bars expose `role="progressbar"` + `aria-valuenow/min/max`; the filter cluster is a `role="group"` with `aria-pressed` tabs; per-card actions carry descriptive `aria-label`s — preserve these when extracting the components.
