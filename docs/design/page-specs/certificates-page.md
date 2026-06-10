# Certificates Page UI Layout Specification

## 0. Scope & Assumptions

This is a no-implementation visual layout plan for the **learner-dashboard `CertificatesPage`** (`frontend/src/features/dashboard/pages/CertificatesPage.tsx`). The page renders inside `DashboardLayout`'s `<main>` `<Outlet />`. This spec covers **only the content column**: the topbar, sidebar, and scroll container are owned by `DashboardLayout` and are out of scope.

**Current state.** `CertificatesPage.tsx` is a stub containing only a page shell and an H1 header block. No certificate data model, no certificate API, and no list logic exist in the frontend. The backend has no certificate-generation endpoint. This spec defines a UI-state model for mock data first, with a clear migration path to real API calls when the backend is ready.

**Established patterns this spec builds on:**
- `MyCoursesPage.tsx` for the page shell, summary strip, `FilterTabs` toolbar, and card grid layout.
- `ProgressPage.tsx` for the in-progress list-row pattern (`bg-surface border border-border-default rounded-lg divide-y divide-border-default`) and the wrapped summary strip with `flex-wrap gap-x-5`.
- `DashboardLayout.tsx` for context: the `<main>` element is `flex-1 overflow-y-auto`; the page controls its own internal padding.

**Assumptions:**
- No certificate-generation or certificate-retrieval API exists. The implementation must use mock data and clearly mark backend-dependent actions.
- Certificate-related data will eventually come from enrollment and progress endpoints once the backend adds certificate generation.
- `CertificateItem` (defined in §1) is a UI-state model only. It is not a backend contract.
- The page targets learners in a product UI context, not a marketing context. Design follows product rules: calm, credible, professional. Certificates are professional credentials, not game rewards.

**Design cleanup note on the existing stub.** The stub uses `className="px-8 py-8 pb-14 max-w-container"`. It is missing `mx-auto`, which is present in both `MyCoursesPage` and `ProgressPage`. The canonical shell must include `mx-auto`. Adopt it when implementing. The stub subtitle (`Download and share the credentials you have earned.`) should also be updated to the canonical subtitle defined in §2.2.

---

## 1. Certificate State Model

This is a **UI-state model for mock data**. Do not treat these field names as backend API contracts. When the backend adds certificate support, replace mock data with real API calls and adjust field names to match the actual response shape.

```ts
type CertificateStatus = 'issued' | 'eligible' | 'in_progress';

type CertificateItem = {
  id: string;
  courseTitle: string;
  instructor: string;
  category?: string;
  status: CertificateStatus;
  issuedAt?: string;       // ISO 8601 date string; present when status === 'issued'
  completedAt?: string;    // ISO 8601 date string; present when status === 'eligible'
  progress?: number;       // 0–100; present when status === 'in_progress'
  certificateId?: string;  // present when status === 'issued'; used for deep links and downloads
};
```

**Status semantics:**

| Status | Meaning | Badge | Primary action |
|---|---|---|---|
| `issued` | Course completed; certificate generated and available | `Badge variant="anzac"` — "Issued" | View certificate |
| `eligible` | Course completed; certificate not yet generated | `Badge variant="salem"` — "Ready" | Generate certificate |
| `in_progress` | Course not yet complete; progressing toward certificate eligibility | None | Continue course |

**Filter type:**

```ts
type CertificateFilter = 'all' | 'issued' | 'ready' | 'in-progress';
```

---

## 2. Layout & Structure

The page is a single vertical content column inside `DashboardLayout > main`. Top-to-bottom:

1. **Page shell** — canonical dashboard content shell (§2.1).
2. **Page header** — H1 + subtitle, `mb-8` block (§2.2).
3. **Summary strip** — compact inline metrics; not the `Stat` component (§2.3).
4. **Toolbar row** — `FilterTabs` with All / Issued / Ready / In progress (§2.4).
5. **LatestCertificateRow** — conditional horizontal featured row; shown only if at least one `issued` certificate exists and the active filter is `all` or `issued` (§2.5).
6. **Certificate grid** — card grid of `issued` and `eligible` items matching the active filter (§2.6).
7. **In-progress section** — quiet list-row block for `in_progress` items; shown when filter is `all` or `in-progress` (§2.7).
8. **Empty state** — rendered when the filtered result set is empty, or when no data exists at all (§6.1).

No `<Container>`, `<SectionHeader>`, `<Stat>`, or marketing chrome belongs on this page.

### 2.1 Page shell

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

This is the canonical dashboard content shell, matching `MyCoursesPage`. `DashboardLayout` owns the scroll container (`overflow-y-auto` on `<main>`); the page controls its own padding.

**Design cleanup notes.**
- The existing stub omits `mx-auto`. Add it.
- `ProgressPage.tsx` uses responsive padding `px-4 py-6 sm:px-8 sm:py-8` for better mobile experience. Adopting the responsive variant for `CertificatesPage` is a valid enhancement but is a separate cleanup from the core `mx-auto` fix.

### 2.2 Page header

```tsx
<div className="mb-8">
  <h1 className="text-title font-semibold text-text-primary">Certificates</h1>
  <p className="text-body-sm text-text-secondary mt-1">
    View, download, and share the certificates you have earned.
  </p>
</div>
```

**Design cleanup note.** The existing stub subtitle reads "Download and share the credentials you have earned." Update it to the canonical subtitle above when implementing.

### 2.3 Summary strip

An inline, dot-separated metric line. Not the `Stat` component. Follows `MyCoursesPage`'s dot-separator pattern.

Example: `3 certificates earned  ·  1 ready to generate  ·  2 in progress`

Metrics:
- Count of `issued` items, labeled "earned" — e.g. "3 certificates earned"
- Count of `eligible` items, labeled "ready to generate" — e.g. "1 ready to generate"
- Count of `in_progress` items, labeled "in progress" — e.g. "2 in progress"

Zero-count metrics still render (e.g. "0 ready to generate") so the strip does not shift layout between data states.

Wrapper: `flex items-center gap-0 mb-8 text-body-sm text-text-secondary` with `aria-label="Certificate statistics"`.

### 2.4 Toolbar row

```tsx
<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
  <span className="text-body-sm text-text-secondary">
    {count} {count === 1 ? 'certificate' : 'certificates'}
  </span>
  <FilterTabs
    options={[
      { value: 'all',         label: 'All'         },
      { value: 'issued',      label: 'Issued'      },
      { value: 'ready',       label: 'Ready'       },
      { value: 'in-progress', label: 'In progress' },
    ]}
    value={filter}
    onChange={setFilter}
    aria-label="Filter certificates"
  />
</div>
```

**Filter behavior:**

| Active filter | Certificate grid shows | In-progress section shows | LatestCertificateRow shows |
|---|---|---|---|
| `all` | `issued` + `eligible` | Yes | Yes (if any `issued`) |
| `issued` | `issued` only | No | Yes (if any `issued`) |
| `ready` | `eligible` only | No | No |
| `in-progress` | Hidden | Yes | No |

### 2.5 LatestCertificateRow (conditional)

Renders only when at least one `issued` certificate exists and the active filter is `all` or `issued`. Shows the most recently issued certificate (highest `issuedAt`).

This is a horizontal featured row, restrained in the same spirit as `FeaturedCourseRow` in `MyCoursesPage`, but certificate-specific. The left block is a tonal document preview, not a Salem gradient strip. That distinction is intentional: a Salem gradient reads as a brand moment; a tonal `bg-surface-elevated` block reads as a document placeholder. This page is professional, not theatrical.

**Shell:** `flex bg-surface border border-border-hover rounded-lg overflow-hidden mb-6`

**Left document preview block:** `hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch bg-surface-elevated`
- Purely tonal; no image, no gradient.
- Optional: a centered `FileText` or `Award` icon from lucide-react at 20px, `text-text-muted aria-hidden="true"`.
- Mark the block `aria-hidden="true"` — it is decorative.

**Right content block:** `flex-1 p-4`

Within the right block, top-to-bottom:
- Header row (`flex items-start justify-between gap-2 mb-0.5`):
  - Eyebrow: `text-caption text-text-muted` — "Latest certificate"
  - `Badge variant="anzac"` — "Issued" (`flex-shrink-0`)
- Course title: `text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5`
- Metadata: `text-caption text-text-secondary mb-3` — `{instructor} · Issued {formatted issuedAt}`
- Action row (`flex items-center gap-2 flex-wrap`):
  - Primary: `Button variant="secondary" size="sm"` — "View certificate"
  - Secondary: Salem text-link — "Download"
  - Tertiary (conditional on §9 decision 2): Salem text-link — "Share"

### 2.6 Certificate grid

Renders `issued` and `eligible` items as cards. `in_progress` items are handled in §2.7.

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
  {certificates.map(cert => (
    <CertificateCard key={cert.id} certificate={cert} />
  ))}
</div>
```

The grid uses `md:grid-cols-2 xl:grid-cols-3` rather than `sm:grid-cols-2 lg:grid-cols-3` (as in `MyCoursesPage`) because certificate cards carry more content per item: actions, date metadata, and a status badge. They need more horizontal space at smaller breakpoints.

**Issued card anatomy (`status === 'issued'`):**
- Shell: `bg-surface border border-border-default rounded-lg p-4 hover:border-border-hover motion-safe:transition-colors duration-fast`
- No shadow at rest. Cards contain discrete action buttons and are not fully clickable, so no hover-lift. See §7 for the clickability rule.
- Optional document preview area: `bg-surface-elevated rounded-md h-14 mb-3` — tonal rectangle, no image. See §9, decision 3.
- Header row (`flex items-start justify-between gap-2 mb-1`):
  - Title: `text-body-sm font-semibold text-text-primary line-clamp-2 flex-1`
  - `Badge variant="anzac"` — "Issued" (`flex-shrink-0 mt-0.5`)
- Instructor: `text-caption text-text-secondary mb-0.5`
- Issued date: `<time className="text-caption text-text-muted mb-3" dateTime="{issuedAt}">`
- Action row (`flex items-center gap-2 mt-3`):
  - `Button variant="secondary" size="sm"` — "View", `aria-label="View certificate for {courseTitle}"`
  - Salem text-link — "Download", `aria-label="Download certificate for {courseTitle}"`

**Eligible card anatomy (`status === 'eligible'`):**
- Shell: identical to issued card.
- Header row: `Badge variant="salem"` — "Ready".
- Date line: shows completed date rather than issued date: `<time className="text-caption text-text-muted mb-3" dateTime="{completedAt}">` — "Completed {formatted completedAt}".
- Action row: `Button variant="secondary" size="sm"` — "Generate certificate", `aria-label="Generate certificate for {courseTitle}"`.
- **Implementation note.** If backend generation is not available, render the button with the `disabled` prop and add a caption below: `text-caption text-text-muted mt-1` — "Certificate generation coming soon." Do not hide the button; a visible-but-disabled affordance is more informative than silence.

### 2.7 In-progress section

A quieter, list-row layout for courses not yet completed. No certificate badge; no Anzac. Follows `ProgressPage`'s list-row pattern directly.

```tsx
<section className="mb-6" aria-label="In progress">
  <h2 className="text-body-sm font-medium text-text-secondary mb-3">
    In progress ({count})
  </h2>
  <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
    {inProgressItems.map(item => (
      <CertificateProgressRow key={item.id} item={item} />
    ))}
  </ul>
</section>
```

**`CertificateProgressRow` anatomy:**
- Wrapper: `<li className="px-5 py-4">`
- Header row (`flex items-start justify-between gap-4 mb-2.5`):
  - Left block (`min-w-0 flex-1`):
    - Title: `text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5`
    - Instructor: `text-caption text-text-secondary`
  - "Continue" action: `text-caption font-medium text-salem flex-shrink-0 min-h-[44px] px-1 rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`, with `ArrowRight` at 11px (`aria-hidden="true"`), `aria-label="Continue {courseTitle}"`
- Progress row (`flex items-center gap-3`):
  - `ProgressBar value={item.progress} label="{courseTitle} progress toward certificate"` — `flex-1`
  - Percentage: `text-caption text-text-secondary w-8 text-right flex-shrink-0`
- Optional lesson count: `text-caption text-text-secondary mt-1.5` — if lesson data is available.

### 2.8 Content-column wireframe (lg breakpoint)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside DashboardLayout > main)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Certificates                              (h1 · text-title / semibold)       │
│ View, download, and share the             (text-body-sm · text-secondary)    │
│ certificates you have earned.                                                │
│                                                                              │
│ 3 certificates earned · 1 ready to generate · 2 in progress   (mb-8)        │
│                                                                              │
│ 4 certificates     [ All ][ Issued ][ Ready ][ In progress ]  (toolbar)     │
│                                                                              │
│ ┌──────┬────────────────────────────────────────────────────────────────┐    │
│ │ ░░░  │ Latest certificate                          [Badge: Issued]   │    │
│ │ ░░░  │ Advanced React Patterns and Architecture                       │    │
│ │ ░░░  │ Sarah Chen · Issued 12 May 2026                                │    │
│ │(doc) │ [View certificate (secondary sm)]  Download  Share            │    │
│ └──────┴────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│ grid-cols-1 md:2 xl:3  gap-4  items-start                                    │
│ ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                   │
│ │ ░░░░░░░░░░░░   │  │ ░░░░░░░░░░░░   │  │ ░░░░░░░░░░░░   │  ← doc preview   │
│ │ Course A   [Issued]│ Course B  [Ready]│ Course C  [Issued]                 │
│ │ Instructor     │  │ Instructor     │  │ Instructor     │                   │
│ │ Issued May '26 │  │ Completed May  │  │ Issued Apr '26 │                   │
│ │ [View] Download│  │ [Generate cert]│  │ [View] Download│                   │
│ └────────────────┘  └────────────────┘  └────────────────┘                   │
│                                                                              │
│ In progress (2)                         (text-body-sm font-medium secondary) │
│ ┌────────────────────────────────────────────────────────────────────────┐    │
│ │  TypeScript for Production    Marcus Webb              Continue →     │    │
│ │  ▰▰▰▰▱▱▱▱▱▱  35%                                                      │    │
│ ├────────────────────────────────────────────────────────────────────────┤    │
│ │  System Design Fundamentals   Priya Mehta              Continue →     │    │
│ │  ▰▰▱▱▱▱▱▱▱▱  12%                                                      │    │
│ └────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Responsive Behavior

| Breakpoint | Shell padding | Certificate grid | LatestCertificateRow preview | Notable |
|---|---|---|---|---|
| base (< 640px) | `px-8 py-8` | 1 col | Hidden (`hidden sm:flex`) | Sidebar is off-canvas drawer (DashboardLayout's concern); FilterTabs may wrap; summary strip may wrap |
| `sm` (640px+) | `px-8 py-8` | 1 col | Visible (`w-20`) | Document preview block appears |
| `md` (768px+) | `px-8 py-8` | 2 cols | Visible | Sidebar becomes static (250px); content centers via `mx-auto` |
| `xl` (1280px+) | `px-8 py-8` | 3 cols | Visible | Full 3-up certificate grid |

The in-progress section remains a vertical list at every breakpoint. It does not switch to a grid.

**Horizontal padding.** A flat `px-8` at every breakpoint follows the `MyCoursesPage` canonical. The `ProgressPage` refinement (`px-4 sm:px-8`) reduces mobile padding and is recommended as a follow-on enhancement, not a requirement for the core implementation.

**Vertical rhythm summary.**

| Zone | Spacing token |
|---|---|
| Header block | `mb-8` |
| Summary strip wrapper | `mb-8` |
| Toolbar row (outer) | `mb-4` |
| LatestCertificateRow | `mb-6` |
| Certificate grid section | `mb-8` |
| In-progress section heading to list | `mb-3` |
| In-progress section | `mb-6` |
| Inside cert card: content padding | `p-4` |
| Inside cert card: preview to title row | `mb-3` |
| Inside cert card: title row | `mb-1` |
| Inside cert card: date to actions | `mt-3` |
| Inside progress row | `px-5 py-4`; title-to-instructor `mb-0.5`; instructor-to-progress `mb-2.5` via row group `mb-2.5`; bar caption `mt-1` |

---

## 4. Token Mapping

All tokens are sourced from `DESIGN.md` and confirmed in `tokens.css` and existing dashboard implementations. No new values are introduced.

### 4.1 Page shell and header

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell `<div>` | — | — | — | inherits `bg-bg-base` | none | `px-8 py-8 pb-14 max-w-container mx-auto` |
| H1 "Certificates" | `text-title` (28px / 1.3) | `font-semibold` (600) | `text-text-primary` | — | none | header block `mb-8` |
| Subtitle | `text-body-sm` (14px / 1.5) | 400 | `text-text-secondary` | — | none | `mt-1` |

### 4.2 Summary strip

| Element | Typography | Weight | Text color | Surface | Spacing |
|---|---|---|---|---|---|
| Strip wrapper | `text-body-sm` | 400 | `text-text-secondary` | — | `flex items-center gap-0 mb-8` |
| Metric value | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | `mr-1.5` |
| `·` separator | `text-body-sm` | 400 | `text-border-hover` | — | `mx-3 select-none aria-hidden="true"` |

### 4.3 Filter tab group (FilterTabs component)

Tokens from the existing `FilterTabs.tsx` implementation:

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Tab (selected) | `text-body-sm` | `font-medium` (500) | `text-salem` | `bg-salem-50` | `rounded-md` | `px-3 py-1.5 min-h-[44px]` |
| Tab (idle) | `text-body-sm` | `font-medium` (500) | `text-text-secondary` hover `text-text-primary` | hover `bg-surface-elevated` | `rounded-md` | `px-3 py-1.5 min-h-[44px]` |
| Group wrapper | — | — | — | — | none | `flex items-center gap-0.5 role="group" aria-label="Filter certificates"` |

### 4.4 LatestCertificateRow

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border border-border-hover rounded-lg overflow-hidden` | `flex mb-6` |
| Document preview block | — | — | — | `bg-surface-elevated` | none (flush, radius from shell) | `hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch` |
| Preview icon (optional) | — | — | `text-text-muted` | — | none | 20px, centered, `aria-hidden="true"` |
| Content block | — | — | — | — | none | `flex-1 p-4` |
| Eyebrow | `text-caption` (12px / 1.5) | 400 | `text-text-muted` | — | none | `mb-1` |
| Course title | `text-body-sm` (14px / 1.5) | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-1 mb-0.5` |
| Metadata | `text-caption` | 400 | `text-text-secondary` | — | none | `mb-3` |
| Status badge | — | — | `text-anzac-700` | `bg-anzac-50` | `rounded-full` | `Badge variant="anzac"` — "Issued" |
| Header row (eyebrow + badge) | — | — | — | — | none | `flex items-start justify-between gap-2 mb-0.5` |
| "View certificate" | `text-btn-sm` | `font-semibold` (600) | `text-text-primary` | `bg-surface border-border-default` hover `bg-surface-elevated` | `rounded-md` | `Button variant="secondary" size="sm"` |
| "Download" text-link | `text-caption` | `font-medium` (500) | `text-salem` hover `text-salem-400` | transparent | `rounded-sm` | `min-h-[44px] px-1 motion-safe:transition-colors duration-fast` |
| Action row | — | — | — | — | none | `flex items-center gap-2 flex-wrap mt-3` |

The document preview block is decorative. Mark it `aria-hidden="true"`.

### 4.5 Issued certificate card

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | — | — | — | `bg-surface` | `border border-border-default hover:border-border-hover rounded-lg` | `p-4 motion-safe:transition-colors duration-fast` |
| Document preview (optional) | — | — | — | `bg-surface-elevated` | `rounded-md` | `h-14 mb-3` |
| Course title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `line-clamp-2 flex-1` |
| Status badge | — | — | `text-anzac-700` | `bg-anzac-50` | `rounded-full` | `Badge variant="anzac"` — "Issued"; `flex-shrink-0 mt-0.5` |
| Header row (title + badge) | — | — | — | — | none | `flex items-start justify-between gap-2 mb-1` |
| Instructor | `text-caption` | 400 | `text-text-secondary` | — | none | `mb-0.5` |
| Issued date | `text-caption` | 400 | `text-text-muted` | — | none | wrap in `<time dateTime="{issuedAt}">` |
| "View" button | — | — | — | — | — | `Button variant="secondary" size="sm"` |
| "Download" text-link | `text-caption` | `font-medium` (500) | `text-salem` hover `text-salem-400` | transparent | `rounded-sm` | `min-h-[44px] px-1` |
| Action row | — | — | — | — | none | `flex items-center gap-2 mt-3` |

No shadow at rest. Cards contain discrete action buttons and are not fully clickable, so no hover-lift.

### 4.6 Eligible (Ready) certificate card

Same shell tokens as the issued card. Differences only:

| Element | Change from issued card |
|---|---|
| Status badge | `Badge variant="salem"` — "Ready" (`bg-salem-50 text-salem`) |
| Date line | Shows completed date rather than issued date: `<time className="text-caption text-text-muted" dateTime="{completedAt}">` |
| Primary action | `Button variant="secondary" size="sm"` — "Generate certificate" |
| Disabled caption | `text-caption text-text-muted mt-1` — "Certificate generation coming soon." (shown when `disabled`) |

**Forest Rule note.** `variant="secondary"` (not `variant="primary"`) is used for "Generate certificate." When multiple eligible cards appear in the grid, a `variant="primary"` button on each would place multiple equal-weight primaries in one view zone. `variant="secondary"` is consistent with all other card-level actions across the dashboard.

### 4.7 In-progress row (CertificateProgressRow)

Follows `ProgressPage.InProgressRow` tokens exactly:

| Element | Typography | Weight | Text color | Surface | Spacing |
|---|---|---|---|---|---|
| Section heading | `text-body-sm` | `font-medium` (500) | `text-text-secondary` | — | `mb-3` |
| List container | — | — | — | `bg-surface border border-border-default rounded-lg divide-y divide-border-default` | section `mb-6` |
| Row `<li>` | — | — | — | — | `px-5 py-4` |
| Course title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | `line-clamp-1 mb-0.5` |
| Instructor | `text-caption` | 400 | `text-text-secondary` | — | — |
| ProgressBar track | — | — | — | `bg-surface-elevated` | `h-1 rounded-full overflow-hidden flex-1` |
| ProgressBar fill | — | — | — | `bg-salem` | `h-full rounded-full` |
| Percentage | `text-caption` | 400 | `text-text-secondary` | — | `w-8 text-right flex-shrink-0` |
| "Continue" action | `text-caption` | `font-medium` (500) | `text-salem` hover `text-salem-400` | transparent | `flex-shrink-0 min-h-[44px] px-1 rounded-sm` |

Anzac is not used anywhere in the in-progress section.

### 4.8 Empty states

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Filter no-results message | `text-body-sm` | 400 | `text-text-muted` | — | none | `py-10 text-center` |
| Empty-page shell | — | — | — | `bg-surface border border-border-default rounded-lg` | `rounded-lg` | `p-8 flex flex-col items-center text-center gap-3` |
| Empty-page title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | — |
| Empty-page body | `text-body-sm` | 400 | `text-text-secondary` | — | none | — |
| Empty-page action | — | — | — | — | — | `Button variant="secondary" size="sm"` |

### 4.9 Error state

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Error surface | — | — | — | `bg-surface` | `border border-border-default rounded-lg` | `p-4` |
| Error title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | — | none | `mb-1` |
| Error message | `text-body-sm` | 400 | `text-text-secondary` | — | none | `mb-3` |
| Retry action | — | — | — | — | — | `Button variant="secondary" size="sm"` |

---

## 5. Component Reusability

### 5.1 Reuse from the existing codebase

| Component | Path | Variant | Role on Certificates page |
|---|---|---|---|
| `Button` | `components/ui/Button.tsx` | `variant="secondary" size="sm"` | All primary card actions: View, Generate. One per card zone enforces the Forest Rule. |
| `Badge` | `components/ui/Badge.tsx` | `variant="anzac"` | Issued state on issued cards and LatestCertificateRow |
| `Badge` | `components/ui/Badge.tsx` | `variant="salem"` | Ready/eligible state; active, action-prompting signal |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | `value`, `label` | In-progress rows; same pattern as ProgressPage |
| `FilterTabs` | `components/ui/FilterTabs.tsx` | generic `T extends string` | All / Issued / Ready / In progress switcher |

**On Download and Share actions.** These are implemented as lightweight Salem text-links rather than `Button` components. Using `Button` for both the primary action ("View") and a secondary action ("Download") in the same card zone would place two equal-weight interactive elements in one zone, working against the Forest Rule. Text-links carry the action without competing for hierarchy.

**On `Card` variants.** `Card variant="stat"` uses `p-md` (16px = `p-4`), which matches the certificate card padding. However, `CertificateCard` needs a custom internal structure — header row with badge, optional preview block, mixed-weight action row — that `CardHeader`/`CardContent`/`CardFooter` do not cleanly accommodate. Writing `CertificateCard` as a bespoke component with a manual `bg-surface border border-border-default rounded-lg p-4` shell is simpler and more legible than composing `Card` sub-components for this case.

### 5.2 New dashboard components to create

| Component | Suggested path | Reuse case | Notes |
|---|---|---|---|
| `CertificateCard` | `components/dashboard/CertificateCard.tsx` | Issued and eligible cards, driven by `certificate.status` | Single component switching on `status`; avoids two near-identical card components |
| `LatestCertificateRow` | `components/dashboard/LatestCertificateRow.tsx` | CertificatesPage only | Justified as a named component because it is visually distinct from the grid cards |
| `CertificateProgressRow` | `components/dashboard/CertificateProgressRow.tsx` or inline | CertificatesPage in-progress section | May overlap with ProgressPage's `InProgressRow`; extract as shared only if both pages need identical row UI |
| `EmptyState` | `components/dashboard/EmptyState.tsx` | Potentially shared across MyCoursesPage, ProgressPage, CertificatesPage | Extract only if the icon/title/body/action pattern repeats on two or more pages; do not extract preemptively |

### 5.3 Components that do not fit

| Component | Reason |
|---|---|
| `Container` | Marketing width primitive; dashboard shell uses inline `px-8 max-w-container mx-auto` |
| `SectionHeader` | Marketing header at `text-display`/`text-headline` scale; the dashboard uses `h1.text-title` + lighter section headings at `text-body-sm font-medium` |
| `Stat` | Renders values at `text-headline` (40px) or `text-display` (56px); built for one hero metric per marketing section; wrong scale for the compact summary strip |
| `TestimonialCard` | Social-proof composition (logo, quote, author); unrelated to certificate management |
| `CourseCard` | Designed for enrolled-course browsing with gradient thumbnails, progress bars, and "Done" badges; certificate cards have different content domain and action set |
| Hero metric grids | The three-metric-cards-in-a-row pattern is the SaaS cliché explicitly named in DESIGN.md's don'ts |
| Gradient text | Explicitly prohibited by DESIGN.md |
| Glassmorphism | Explicitly prohibited by DESIGN.md |
| Colored side stripes thicker than 1px | Explicitly prohibited by DESIGN.md |
| Large Salem section backgrounds | Salem is reserved for full-bleed brand pages, not dashboard card or section surfaces |

---

## 6. Empty, Loading, and Error States

### 6.1 Empty states

**State 1: No certificates at all.** The learner has no issued, eligible, or in-progress certificate paths. Shown when the entire data set is empty.

```
Shell:   bg-surface border border-border-default rounded-lg p-8
Layout:  flex flex-col items-center text-center gap-3
Icon:    Award size={28} className="text-text-muted" aria-hidden="true"
Title:   "No certificates yet"
         text-body-sm font-semibold text-text-primary
Body:    "Complete a course to earn your first certificate."
         text-body-sm text-text-secondary
Action:  "Browse courses"
         Button variant="secondary" size="sm"
         (router link to /dashboard/courses)
```

**State 2: No results for the active filter.** The learner has certificate data, but the active filter matches nothing.

```
Single line, no card shell:
"No certificates match this filter."
text-body-sm text-text-muted py-10 text-center
```

**State 3: Certificate generation unavailable.** The backend does not support certificate generation and the `eligible` items cannot be acted upon. Use this state as a temporary, honest placeholder inside the grid zone only when the implementation explicitly knows the backend is absent.

```
Shell:   bg-surface border border-border-default rounded-lg p-4
Title:   "Certificate generation is not available yet."
         text-body-sm font-semibold text-text-primary mb-1
Body:    "Your completed courses will appear here when certificates are enabled."
         text-body-sm text-text-secondary
No action. Do not offer a retry for a feature that does not exist.
```

Use state 3 only when mock data is not in use. When mock data simulates the full certificate flow, prefer states 1 and 2 based on data availability.

### 6.2 Loading state

Follow the `DashboardPageSkeleton` pattern used for route-level Suspense, if that pattern exists in the project. Wrap the `CertificatesPage` route in `<Suspense fallback={<DashboardPageSkeleton />}>` at the router level, consistent with how other dashboard pages handle route-level loading.

For future in-page data fetching (once a real API exists), use skeleton placeholders matching the final layout:
- Summary strip: `bg-surface-elevated rounded h-4 w-48 animate-pulse`
- Certificate grid: 3 `bg-surface border border-border-default rounded-lg h-44 animate-pulse` blocks in the same grid
- In-progress list: 2 `bg-surface border border-border-default rounded-lg h-20 animate-pulse` blocks

Do not add a spinner component unless one is already used consistently across other dashboard pages.

### 6.3 Error state

An inline error surface within the content column. Not a full-page takeover. Not destructive-red for a data-loading failure.

```
Shell:   bg-surface border border-border-default rounded-lg p-4
Title:   "Could not load certificates."
         text-body-sm font-semibold text-text-primary mb-1
Body:    "Please try again or check your connection."
         text-body-sm text-text-secondary mb-3
Action:  "Try again"
         Button variant="secondary" size="sm"
```

For action-scoped errors (e.g., a "Download" or "Generate" request fails), surface the error inline below the relevant card's action row as `text-caption text-error mt-1`. Do not replace the whole page content for a single-card failure.

---

## 7. Accessibility Notes

**FilterTabs.** The existing `FilterTabs` component uses `role="group"` and `aria-pressed` per option. Pass `aria-label="Filter certificates"` to the component. Keyboard users activate buttons with `Space` or `Enter` and navigate with `Tab`.

**Certificate action labels.** Do not use generic labels. All action buttons carry descriptive `aria-label` values including the course name:
- "View certificate for Advanced React Patterns and Architecture"
- "Download certificate for Advanced React Patterns and Architecture"
- "Generate certificate for Node.js Backend Engineering"
- "Continue Advanced React Patterns and Architecture"

**ProgressBar.** The existing `ProgressBar` component already sets `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, and `aria-valuemax={100}`. Always pass a descriptive `label` prop: `"{courseTitle} progress toward certificate"`.

**Status communication.** Do not communicate status through color alone. Every status is accompanied by visible text in its badge ("Issued", "Ready") or a visible section heading ("In progress"). Color is additive confirmation, not the sole signal.

**Card clickability and nested interactivity.** Certificate cards are not fully clickable. They contain multiple distinct action buttons (View, Download). Do not add an `onClick` to the card shell `<div>`. Nesting focusable elements inside a clickable container creates overlapping keyboard targets and ambiguous focus order. Keep each action as a discrete, labeled button.

**Date semantics.** Dates displayed as "Issued 12 May 2026" or "Completed 3 May 2026" must be wrapped in a `<time dateTime="2026-05-12">` element for semantic accuracy and screen-reader clarity.

**Decorative areas.** The tonal document preview block in both `LatestCertificateRow` and `CertificateCard` is decorative. Mark it `aria-hidden="true"`. Any icon placed inside it must also carry `aria-hidden="true"`.

**Focus rings.** All interactive elements carry the Salem focus ring: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`. Do not suppress focus styles.

**Minimum touch and click targets.** All interactive elements must meet `min-h-[44px]`. Apply `min-h-[44px] px-1 rounded-sm` to text-link actions so the tap target is adequate without visually enlarging the element.

**Reduced motion.** No entrance animations are specified on this page. Wrap transition classes with `motion-safe:transition-*`. If skeleton loading uses `animate-pulse`, this is `prefers-reduced-motion`-safe by default in Tailwind.

**Skip link.** `DashboardLayout` already provides a "Skip to content" link targeting `#main-content`. No additional skip-link work is required on this page.

---

## 8. Design-Rule Compliance Notes

**Anzac is earned, not applied.** `Badge variant="anzac"` (`bg-anzac-50 text-anzac-700`) appears only on `issued` certificates: issued cards and the LatestCertificateRow badge. It does not appear on eligible, in-progress, or neutral states. No Anzac background fills appear anywhere on the page.

**Salem is contained.** Salem appears as: the ProgressBar fill (sanctioned progress role), the FilterTabs active tint (`bg-salem-50`), the `Badge variant="salem"` background on eligible cards (`bg-salem-50`), Salem text-link actions, and focus rings. No large Salem background block appears on the product surface. Salem stays well within the 15% surface area cap.

**No Salem product backgrounds.** The LatestCertificateRow's left block uses `bg-surface-elevated`, not a Salem gradient. This is a deliberate departure from `FeaturedCourseRow`'s Salem ramp in `MyCoursesPage`. A Salem gradient is appropriate on a course card; on a professional certificate credential it would read as brand theatrics.

**Flat-At-Rest Rule.** Certificate cards carry no shadow at rest. Hover uses border intensification (`border-default` to `border-hover`) only. No hover-lift: these cards are not fully clickable. The LatestCertificateRow carries no shadow at rest. No ambient or decorative shadows anywhere on the page.

**Forest Rule (one primary per zone).** All card-level primary actions use `Button variant="secondary"`. No `variant="primary"` button appears in the certificate grid. When multiple eligible cards are in view, a `variant="primary"` on each would place multiple equal-weight primaries in one zone; `variant="secondary"` avoids this. The LatestCertificateRow uses `variant="secondary"` for "View certificate." One Salem-weight affordance per zone is the ProgressBar fill and the active FilterTab.

**No accent stripes.** The LatestCertificateRow uses a full-background tonal block (`bg-surface-elevated`), not a colored left stripe. `border-left`/`border-right` with color thicker than 1px is explicitly prohibited by DESIGN.md.

**No hero-metric grid.** The summary strip uses compact inline `text-body-sm` text. The three-metric-cards-in-a-row pattern with large numbers and gradient accents is the SaaS cliché named in DESIGN.md's don'ts. The `Stat` component is not used here.

**No trophy language or XP patterns.** The page uses "certificates earned", "ready to generate", "in progress": professional credential language. No points, XP, achievements in the gaming sense, trophies, leaderboards, or streak language.

**No em dashes in copy.** All copy uses commas, colons, semicolons, or periods in place of em dashes.

**Type scale constraint.** The page steps `text-title` (H1, 28px) to `text-body-sm` (card titles, section headings, body, 14px) to `text-caption` (metadata, 12px). No `text-title-sm`, `text-headline`, or `text-display` used inside the dashboard content column.

**No gradient text.** No `background-clip: text` with a gradient fill.

**No glassmorphism.** No `backdrop-filter: blur` on this page.

**Three-tier depth maximum.** Surfaces: `bg-bg-base` (page canvas) > `bg-surface` (cards, LatestCertificateRow shell, list containers) > `bg-surface-elevated` (ProgressBar track, document preview block, FilterTab hover). No deeper nesting permitted.

**Professional credential tone.** The page does not read as a trophy wall, a completion celebration screen, or a gamified achievement hub. Certificates are professional documents. This is communicated through restrained color use (Anzac only on earned badges), tonal document previews rather than decorative illustrations, and action-first card layout (View, Download) rather than presentation-first layout (large badge, course art).

---

## 9. Open Decisions

The following items require a decision before or during implementation. None block writing the spec, but each must be resolved before the relevant feature ships.

**1. Certificate generation availability.**
The backend has no certificate-generation endpoint. During implementation, decide:

- **Option A (recommended).** Render the "Generate certificate" button with `disabled` prop and an inline caption `text-caption text-text-muted mt-1` — "Certificate generation coming soon." No network call. Honest and clear about current capability.
- **Option B.** Hide the "Generate certificate" button entirely; show only the "Ready" badge and the completion date. The eligible state becomes visually distinguished but requires no action.
- **Option C.** Show the button as interactive and stub the click to show an inline note explaining the feature is not yet available.

Recommended: Option A. It keeps the UI scaffolding in place when the backend ships and is more informative than silence.

**2. Share action behavior.**
The "Share" action on issued cards and in LatestCertificateRow has no defined backend. Options:

- **Option A.** Copy a shareable URL to the clipboard. Requires a stable certificate URL from the backend.
- **Option B.** Open a pre-filled LinkedIn share dialog. Requires a stable `certificateId` and a known URL scheme for LinkedIn's certification feature.
- **Option C (recommended).** Omit the Share action entirely until the backend issues a shareable certificate URL. Add it back when `certificateId` maps to a public link.

Recommended: Option C. Do not show a Share action that cannot succeed.

**3. Visual document preview in certificate cards.**
The spec includes an optional tonal `bg-surface-elevated rounded-md h-14` rectangle at the top of each certificate card. Options:

- **Option A (recommended).** Keep the tonal rectangle. It communicates "document credential" without requiring a real preview image. Verify in the browser that it reads as meaningful rather than decorative emptiness.
- **Option B.** Remove the preview area entirely. Keep cards text-only: title, instructor, date, badge, and actions. Simpler, lower risk of feeling decorative.
- **Option C.** Center a subtle document SVG icon inside the tonal area to reinforce the credential context.

Recommended: Option A for first implementation. If it reads as decorative emptiness in the browser, remove it without affecting any other part of the layout.

**4. In-progress items on this page vs. ProgressPage only.**
Both `ProgressPage` and `CertificatesPage` could display in-progress course rows. Options:

- **Option A.** Limit `CertificatesPage` to `issued` and `eligible` states only. In-progress courses belong exclusively to `ProgressPage`. Add a "View progress" link from an empty state on `CertificatesPage` when no issued or eligible items exist. If this option is adopted, remove §2.7, remove the in-progress token rows from §4.7, and replace the "In progress" filter tab with a text link to `/dashboard/progress`.
- **Option B (as specced).** `CertificatesPage` shows in-progress courses as a subordinate "on the way" section below the main certificate grid. The page becomes a complete credential-lifecycle view. The in-progress section is visually subordinate (list rows, below the card grid) so it does not compete with the issued and eligible content.

The spec as written follows Option B.

**5. Eligible badge variant: salem vs. default.**
The spec uses `Badge variant="salem"` for "Ready" (eligible) status. An alternative is `Badge variant="default"` (neutral surface tint) to signal a passive waiting state rather than an active prompt. Recommended: Salem. It correctly frames "Ready" as an action prompt (generate the certificate now), not a neutral state. If the team prefers a quieter signal, switch to `variant="default"`.

**6. LatestCertificateRow visibility threshold.**
The spec renders LatestCertificateRow when at least one issued certificate exists. An alternative is to show it only when two or more total certificate records exist (so the featured row adds information beyond what the grid alone shows). Recommended: show on first issued certificate. The row provides immediate access to the most recent credential and establishes its professional significance before the learner scans the full grid.
