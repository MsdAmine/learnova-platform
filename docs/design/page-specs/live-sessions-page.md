# Live Sessions Page UI Layout Specification

## 0. Scope & Assumptions

This is a no-implementation visual layout plan for the **learner-dashboard `LiveSessionsPage`** (`frontend/src/features/dashboard/pages/LiveSessionsPage.tsx`). The page renders inside `DashboardLayout`'s `<main>` `<Outlet />`. This spec covers **only the content column**: the topbar, sidebar, and scroll container are owned by `DashboardLayout` and are out of scope.

**Current state.** `LiveSessionsPage.tsx` is a stub containing a page shell and an H1 header block. The existing shell reads `className="px-8 py-8 pb-14 max-w-container"`, missing `mx-auto`. The stub subtitle reads "Upcoming and past live sessions from your courses." Both must be corrected when implementing.

**Design cleanup notes on the existing stub.**
- Shell missing `mx-auto`. Canonical form: `className="px-8 py-8 pb-14 max-w-container mx-auto"`.
- Update stub subtitle to the canonical subtitle defined in §2.2.

**Live session backend status.** No live session API endpoint exists in the backend at the time this spec was written. The implementation must use mock data and clearly mark backend-dependent actions. `LiveSessionItem` (defined in §1) is a UI-state model only. It is not a backend contract.

**Meeting integration status.** Jitsi or any other meeting platform integration does not exist in the backend. Meeting URLs (`meetingUrl`) are optional fields that must be treated as absent until integration is confirmed. Any action requiring a `meetingUrl` must degrade gracefully when the field is absent.

**Established patterns this spec builds on:**
- `MyCoursesPage.tsx` for the page shell, summary strip, FilterTabs toolbar, and section-heading conventions.
- `ProgressPage.tsx` for the list-row pattern (`bg-surface border border-border-default rounded-lg divide-y divide-border-default`), section heading, and Salem text-link action style.
- `CertificatesPage.tsx` for the featured-row anatomy with tonal left block, eyebrow, summary strip, and badge-variant semantics.
- `DashboardLayout.tsx` for context: `<main>` is `flex-1 overflow-y-auto`; the page controls its own internal padding.

**Assumptions.**
- The page targets learners only. Instructor session management belongs to a future instructor-facing page.
- Live sessions are associated with enrolled courses. A learner sees sessions from courses they are enrolled in.
- Filtering operates client-side against mock data in v1. When a real API exists, filtering may move server-side.
- The page is a professional schedule surface, not an event marketplace or webinar sales page. It must be calm, scannable, and action-oriented.

---

## 1. Live Session State Model

This is a **UI-state model for mock data**. Do not treat these field names as backend API contracts. When the backend adds live session support, replace mock data with real API calls and adjust field names to match the actual response shape.

```ts
type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

type LiveSessionItem = {
  id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  startsAt: string;           // ISO 8601 date-time string
  endsAt: string;             // ISO 8601 date-time string
  status: LiveSessionStatus;
  meetingUrl?: string;        // present only when status === 'live' and integration is enabled
  recordingUrl?: string;      // present only when status === 'completed' and recording exists
  attendanceStatus?: 'registered' | 'attended' | 'missed';
};

type LiveSessionFilter = 'all' | 'live' | 'upcoming' | 'past';
```

**Status semantics:**

| Status | Meaning | Featured row eligible | Badge variant | Badge label | Primary action |
|---|---|---|---|---|---|
| `live` | Currently joinable | Yes (first priority) | `salem` | "Live now" | Join session (only if `meetingUrl` present) |
| `scheduled` | Future session, not yet started | Yes (nearest only, if no live session) | `default` | "Upcoming" | None (see §10.5) |
| `completed` | Session has ended; recording may be available | No | `default` | "Completed" | Watch recording (only if `recordingUrl` present) |
| `cancelled` | Session was cancelled | No | `coral` | "Cancelled" | None |

**Filter behavior:**

| Active filter | Featured row | Upcoming section | Past section |
|---|---|---|---|
| `all` | Yes: live session first; else nearest scheduled | All `scheduled` sessions except the featured one | All `completed` + `cancelled` sessions |
| `live` | No featured row; all live sessions in a flat list | No | No |
| `upcoming` | No featured row; all scheduled sessions in a flat list | Yes (no featured row distinction) | No |
| `past` | No | No | All `completed` + `cancelled` sessions |

**Design note on the `all` filter.** The featured row is exclusive to the `all` filter. It surfaces the single most urgent or nearest session. When the `live` or `upcoming` filter is active, the full flat list is more useful than singling out one session.

**Featured session logic.**
1. If one or more sessions have `status === 'live'`: feature the first live session.
2. If no live session but `scheduled` sessions exist: feature the session with the earliest `startsAt`.
3. If neither condition is met: no featured row.

When a session is featured, remove it from the upcoming sessions list below to prevent duplicate display. If the featured session is the only scheduled session, the "Upcoming" section does not render.

---

## 2. Layout & Structure

The page is a single vertical content column inside `DashboardLayout > main`. Top-to-bottom:

1. **Page shell** (§2.1)
2. **Page header** (§2.2)
3. **Summary strip** (§5.1): compact inline metrics; not the `Stat` component
4. **Toolbar row** (§5.2): `FilterTabs` with All / Live / Upcoming / Past
5. **FeaturedSessionRow** (§5.3): conditional; `all` filter only; live session first, else nearest scheduled
6. **Upcoming sessions section** (§5.4): `scheduled` sessions not in the featured row
7. **Past sessions section** (§5.6): `completed` + `cancelled` sessions
8. **Empty states** (§7)

No `<Container>`, `<SectionHeader>`, `<Stat>`, or marketing chrome belongs on this page.

### 2.1 Page shell

```tsx
<div className="px-8 py-8 pb-14 max-w-container mx-auto">
```

`DashboardLayout` owns `overflow-y-auto` on `<main>`; the page controls its own padding.

**Design cleanup note.** The existing stub omits `mx-auto`. Add it. `ProgressPage.tsx` uses responsive padding `px-4 py-6 sm:px-8 sm:py-8` for better mobile experience. Adopting the responsive variant is a valid enhancement but is a separate cleanup from the core `mx-auto` fix.

### 2.2 Page header

```tsx
<div className="mb-8">
  <h1 className="text-title font-semibold text-text-primary">Live Sessions</h1>
  <p className="text-body-sm text-text-secondary mt-1">
    Join upcoming instructor-led sessions and review your schedule.
  </p>
</div>
```

**Design cleanup note.** The existing stub subtitle reads "Upcoming and past live sessions from your courses." Update it to the canonical subtitle above when implementing.

### 2.3 Content-column wireframe (lg breakpoint, `all` filter, one live session present)

```
 px-8 py-8 pb-14 max-w-container mx-auto   (inside DashboardLayout > main)
┌──────────────────────────────────────────────────────────────────────────────┐
│ Live Sessions                         (h1 · text-title / semibold)           │
│ Join upcoming instructor-led...       (text-body-sm · text-secondary)        │
│                                                               (mb-8)          │
│ 1 live now · 3 upcoming · 2 recordings available    (summary strip, mb-8)    │
│                                                                               │
│ 4 sessions    [ All ][ Live ][ Upcoming ][ Past ]   (toolbar row, mb-4)      │
│                                                                               │
│ ┌──────┬────────────────────────────────────────────────────────────────┐    │
│ │ ░░░  │ Live now                               [Badge: Live now]       │    │
│ │ ░░░  │ Advanced React Q&A                                             │    │
│ │(vid) │ Advanced React Patterns · Sarah Chen                           │    │
│ │      │ Started 14:00 · ends 15:00, 10 Jun 2026                        │    │
│ │      │ [Join session (primary sm)]                                    │    │
│ └──────┴────────────────────────────────────────────────────────────────┘    │
│ (mb-6)                                                                        │
│ Upcoming (3)             (text-body-sm font-medium text-secondary mb-3)      │
│ ┌────────────────────────────────────────────────────────────────────────┐    │
│ │ 12 Jun  │ React Patterns Q&A      React Patterns · S. Chen            │    │
│ │ Thu     │ 14:00 - 15:30                              [Upcoming]        │    │
│ ├────────────────────────────────────────────────────────────────────────┤    │
│ │ 15 Jun  │ TypeScript Deep Dive    TypeScript Prod · M. Webb            │    │
│ │ Mon     │ 10:00 - 11:00                              [Upcoming]        │    │
│ └────────────────────────────────────────────────────────────────────────┘    │
│ (mb-6)                                                                        │
│ Past sessions (2)        (text-body-sm font-medium text-secondary mb-3)      │
│ ┌────────────────────────────────────────────────────────────────────────┐    │
│ │  5 Jun  │ Intro to TypeScript     TypeScript Prod · M. Webb            │    │
│ │  Wed    │ 10:00 - 11:00                [Completed]  Watch recording    │    │
│ ├────────────────────────────────────────────────────────────────────────┤    │
│ │  1 Jun  │ System Design Q&A       System Design · P. Mehta             │    │
│ │  Sat    │ 09:00 - 10:00                             [Cancelled]        │    │
│ └────────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Responsive Behavior

| Breakpoint | Shell padding | FeaturedSessionRow left block | List row right block | Notable |
|---|---|---|---|---|
| base (< 640px) | `px-8 py-8` | Hidden (`hidden sm:flex`) | Stacked below center content | Sidebar is off-canvas drawer owned by `DashboardLayout`; FilterTabs may wrap to two lines; summary strip may wrap |
| `sm` (640px+) | `px-8 py-8` | Visible (`w-20`) | Inline with content | FeaturedSessionRow left icon block appears |
| `md` (768px+) | `px-8 py-8` | Visible | Inline | Sidebar becomes static (250px); content centers via `mx-auto` |
| `lg` (1024px+) | `px-8 py-8` | Visible | Inline | Full layout as in wireframe |

**Horizontal padding.** A flat `px-8` at every breakpoint follows the `MyCoursesPage` canonical. The `ProgressPage` refinement (`px-4 sm:px-8`) reduces mobile padding and is recommended as a follow-on enhancement, not a requirement.

**List row responsive behavior.** Each `LiveSessionRow` uses a three-part structure: left time block, center content block, right badge and action. On mobile, the right block stacks below the center content:

```
Mobile (< sm):
┌──────────────────────────────────────────┐
│ 12 Jun   React Patterns Q&A              │
│          Advanced React Patterns         │
│          Sarah Chen · 14:00 - 15:30      │
│          [Badge: Upcoming]               │
└──────────────────────────────────────────┘

sm+:
┌──────────────────────────────────────────────────┐
│ 12 Jun  │ React Patterns Q&A     [Badge: Upcoming]│
│ Thu     │ Advanced React Patterns · Sarah Chen    │
│         │ 14:00 - 15:30                           │
└──────────────────────────────────────────────────┘
```

**Summary strip wrapping.** The strip uses `flex-wrap` so content wraps gracefully on narrow viewports without overflow. The dot separators remain inline with their adjacent metric spans.

**Vertical rhythm summary.**

| Zone | Spacing |
|---|---|
| Header block | `mb-8` |
| Summary strip wrapper | `mb-8` |
| Toolbar row (outer wrapper) | `mb-4` |
| FeaturedSessionRow | `mb-6` |
| Upcoming section | `mb-6` |
| Past sessions section | `mb-6` |
| Section heading to list | `mb-3` |
| Inside row | `px-5 py-4` |
| Inside FeaturedSessionRow content block | `p-4` |

---

## 4. Token Mapping

All tokens are sourced from `DESIGN.md` and confirmed in `tokens.css` and existing dashboard implementations. No new values are introduced.

### 4.1 Page shell and header

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell `<div>` | none | none | none | inherits `bg-bg-base` | none | `px-8 py-8 pb-14 max-w-container mx-auto` |
| H1 "Live Sessions" | `text-title` (28px / 1.3) | `font-semibold` (600) | `text-text-primary` | none | none | header block `mb-8` |
| Subtitle | `text-body-sm` (14px / 1.5) | 400 | `text-text-secondary` | none | none | `mt-1` |

### 4.2 Summary strip

| Element | Typography | Weight | Text color | Surface | Spacing |
|---|---|---|---|---|---|
| Strip wrapper | `text-body-sm` | 400 | `text-text-secondary` | none | `flex flex-wrap items-center gap-0 mb-8` with `aria-label="Session statistics"` |
| Metric value | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | none | `mr-1.5` |
| `·` separator | `text-body-sm` | 400 | `text-border-hover` | none | `mx-3 select-none aria-hidden="true"` |

### 4.3 Filter tab group (FilterTabs component)

Tokens match the existing `FilterTabs.tsx` implementation exactly.

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Tab (selected) | `text-body-sm` | `font-medium` (500) | `text-salem` | `bg-salem-50` | `rounded-md` | `px-3 py-1.5 min-h-[44px]` |
| Tab (idle) | `text-body-sm` | `font-medium` (500) | `text-text-secondary` hover `text-text-primary` | hover `bg-surface-elevated` | `rounded-md` | `px-3 py-1.5 min-h-[44px]` |
| Group wrapper | none | none | none | none | none | `flex items-center gap-0.5 role="group"` |

### 4.4 FeaturedSessionRow

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Shell | none | none | none | `bg-surface` | `border border-border-hover rounded-lg overflow-hidden` | `flex mb-6` |
| Left icon block | none | none | `text-text-muted` | `bg-surface-elevated` | flush, radius from shell | `hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch aria-hidden="true"` |
| Video icon (20px) | none | none | `text-text-muted` | none | none | centered, `aria-hidden="true"` |
| Content block | none | none | none | none | none | `flex-1 p-4` |
| Header row (eyebrow + badge) | none | none | none | none | none | `flex items-start justify-between gap-2 mb-0.5` |
| Eyebrow text | `text-caption` (12px / 1.5) | 400 | `text-text-muted` | none | none | none |
| Status badge | see §4.5 | none | none | none | none | `flex-shrink-0` |
| Session title | `text-body-sm` (14px / 1.5) | `font-semibold` (600) | `text-text-primary` | none | none | `line-clamp-1 mb-0.5` |
| Course and instructor | `text-caption` (12px / 1.5) | 400 | `text-text-secondary` | none | none | `mb-0.5` |
| Time | `text-caption` | 400 | `text-text-secondary` | none | none | wrap in `<time dateTime>`, `mb-3` |
| Action row | none | none | none | none | none | `flex items-center gap-2 flex-wrap mt-3` |
| "Join session" (live + meetingUrl present) | button text | 600 | `text-white` | `bg-salem` | `rounded-md` | `Button variant="primary" size="sm"` |
| "Join session" (live, no meetingUrl) | button text | 600 | 40% opacity | 40% opacity | `rounded-md` | `Button variant="secondary" size="sm" disabled` |
| Disabled helper caption | `text-caption` | 400 | `text-text-muted` | none | none | `mt-1` |

The left icon block is decorative. Mark it `aria-hidden="true"`. The Video icon within it also carries `aria-hidden="true"`.

### 4.5 Badge mapping

| Condition | Label | Variant | Surface / text color | Usage constraint |
|---|---|---|---|---|
| `status === 'live'` | "Live now" | `salem` | `bg-salem-50 text-salem` | Active state; Forest Focus Green is the active color |
| `status === 'scheduled'` | "Upcoming" | `default` | `bg-surface-elevated text-text-secondary` | Neutral future state |
| `status === 'completed'` | "Completed" | `default` | `bg-surface-elevated text-text-secondary` | Neutral past state |
| `status === 'cancelled'` | "Cancelled" | `coral` | `bg-coral-50 text-coral-700` | Warning state; session no longer available |
| `attendanceStatus === 'attended'` (§10.4) | "Attended" | `anzac` | `bg-anzac-50 text-anzac-700` | Achievement; use only if attendance tracking ships in v1 |

### 4.6 LiveSessionRow (list row pattern)

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| List container | none | none | none | `bg-surface border border-border-default rounded-lg divide-y divide-border-default` | `rounded-lg` | section `mb-6` |
| Row `<li>` | none | none | none | none | none | `px-5 py-4` |
| Row inner wrapper | none | none | none | none | none | `flex items-start gap-4` |
| Time block | none | none | none | none | none | `w-14 flex-shrink-0 flex flex-col gap-0.5 pt-0.5` |
| Date line | `text-caption` (12px / 1.5) | `font-semibold` (600) | `text-text-primary` | none | none | wrap in `<time dateTime>` |
| Day-of-week label | `text-caption` | 400 | `text-text-muted` | none | none | abbreviated 3-letter format, e.g., "Thu" |
| Start time | `text-caption` | 400 | `text-text-secondary` | none | none | e.g., "14:00" |
| Center content block | none | none | none | none | none | `flex-1 min-w-0` |
| Session title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | none | none | `line-clamp-1 mb-0.5` |
| Course and instructor | `text-caption` | 400 | `text-text-secondary` | none | none | `{courseTitle} · {instructor}` |
| Time range (sm+) | `text-caption` | 400 | `text-text-muted` | none | none | e.g., "14:00 - 15:00" |
| Attendance caption (optional) | `text-caption` | 400 | `text-text-muted` | none | none | `mt-1` |
| Right block | none | none | none | none | none | `flex-shrink-0 flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2` |
| Text-link action (Join / Watch recording) | `text-caption` | `font-medium` (500) | `text-salem` hover `text-salem-400` | transparent | `rounded-sm` | `min-h-[44px] px-1 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem` |

### 4.7 Section heading

| Element | Typography | Weight | Text color | Surface | Spacing |
|---|---|---|---|---|---|
| `<h2>` | `text-body-sm` (14px / 1.5) | `font-medium` (500) | `text-text-secondary` | none | `mb-3` |
| Count (inline) | `text-body-sm` | `font-medium` (500) | `text-text-secondary` | none | inline |

### 4.8 Empty states

| Element | Typography | Weight | Text color | Surface | Border / Radius | Spacing |
|---|---|---|---|---|---|---|
| Page-empty container | none | none | none | `bg-surface border border-border-default rounded-lg` | `rounded-lg` | `p-8 flex flex-col items-center text-center gap-3` |
| Page-empty title | `text-body-sm` | `font-semibold` (600) | `text-text-primary` | none | none | none |
| Page-empty body | `text-body-sm` | 400 | `text-text-secondary` | none | none | none |
| Filter no-results line | `text-body-sm` | 400 | `text-text-muted` | none | none | `py-10 text-center` |

---

## 5. Section Specifications

### 5.1 Summary Strip

An inline, dot-separated metric line reflecting the full data set regardless of the active filter. Not the `Stat` component.

**Metrics:**
- Count of sessions with `status === 'live'`, labeled "live now" (e.g., "1 live now")
- Count of sessions with `status === 'scheduled'`, labeled "upcoming" (e.g., "3 upcoming")
- Count of sessions where `status === 'completed'` and `recordingUrl` exists, labeled "recordings available" (e.g., "2 recordings available")

**Example rendered text:** `1 live now · 3 upcoming · 2 recordings available`

Zero counts still render (e.g., "0 live now") so the strip does not shift layout between data states.

Wrapper: `flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary` with `aria-label="Session statistics"`.

When the strip wraps on narrow viewports, the `flex-wrap` allows graceful two-line rendering. Keep each metric span (`<span className="flex items-center">`) self-contained so the separator and adjacent metric stay together.

### 5.2 Toolbar Row

```tsx
<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
  <span className="text-body-sm text-text-secondary">
    {count} {count === 1 ? 'session' : 'sessions'}
  </span>
  <FilterTabs
    options={[
      { value: 'all',      label: 'All'      },
      { value: 'live',     label: 'Live'     },
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'past',     label: 'Past'     },
    ]}
    value={filter}
    onChange={setFilter}
    aria-label="Filter sessions"
  />
</div>
```

**Count displayed in the toolbar:**

| Active filter | Count |
|---|---|
| `all` | total sessions (all statuses) |
| `live` | count of `live` sessions |
| `upcoming` | count of `scheduled` sessions |
| `past` | count of `completed` + `cancelled` sessions |

### 5.3 FeaturedSessionRow

Renders only when the active filter is `all` and at least one `live` or `scheduled` session exists. See §1 for featured selection priority.

**Eyebrow text by status:**
- `status === 'live'`: "Live now"
- `status === 'scheduled'`: "Next session"

**Shell:** `flex bg-surface border border-border-hover rounded-lg overflow-hidden mb-6`

**Left icon block:** `hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch bg-surface-elevated aria-hidden="true"`. Contains a `Video` icon from `lucide-react` at `size={20}`, `className="text-text-muted" aria-hidden="true"`. The block is purely tonal: it communicates "live session" without requiring a real image. No Salem gradient fill. This parallels the `LatestCertificateRow` left block in `CertificatesPage`: a tonal block for a professional, document-type surface rather than a course brand moment.

**Right content block:** `flex-1 p-4`

Top-to-bottom within the content block:
- Header row (`flex items-start justify-between gap-2 mb-0.5`): eyebrow left, status badge right (`flex-shrink-0`)
- Session title: `text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5`
- Course and instructor: `text-caption text-text-secondary mb-0.5` formatted as `{courseTitle} · {instructor}`
- Time: `<time className="text-caption text-text-secondary mb-3" dateTime="{startsAt}">` formatted as "Started {startTime} · ends {endTime}" for live, or "{date}, {startTime} - {endTime}" for scheduled
- Action row (`flex items-center gap-2 flex-wrap mt-3`): see action rules below

**Action rules on FeaturedSessionRow:**

| Condition | Action rendered |
|---|---|
| `status === 'live'` and `meetingUrl` present | `Button variant="primary" size="sm"` — "Join session" |
| `status === 'live'` and `meetingUrl` absent | `Button variant="secondary" size="sm" disabled` — "Join session", plus caption below: `text-caption text-text-muted mt-1` — "Meeting link not available yet." |
| `status === 'scheduled'` | No action button. A "View details" action is an open decision (§10.5). |

**Forest Rule.** The `Button variant="primary"` on this row is the only filled Salem button on the page. It is reserved for the join action when a live session with a valid meeting URL exists. This is the single most time-sensitive action the page surfaces.

### 5.4 Upcoming Sessions Section

Renders when the active filter is `all` or `upcoming`, and at least one `scheduled` session exists (excluding the featured session in `all` mode).

```tsx
<section className="mb-6" aria-label="Upcoming sessions">
  <h2 className="text-body-sm font-medium text-text-secondary mb-3">
    Upcoming ({count})
  </h2>
  <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
    {upcomingSessions.map(session => (
      <LiveSessionRow key={session.id} session={session} />
    ))}
  </ul>
</section>
```

Sessions sorted by `startsAt` ascending (nearest first).

If the featured session was the only scheduled session, this section does not render at all (not even the heading).

### 5.5 LiveSessionRow (shared anatomy)

Used for rows in both the upcoming and past sections. The right block varies by `session.status`.

**Row outer:** `<li className="px-5 py-4">`

**Row inner:** `flex items-start gap-4`

**Left time block** (`w-14 flex-shrink-0 flex flex-col gap-0.5 pt-0.5`):
- Date: `<time dateTime="{startsAt}" className="text-caption font-semibold text-text-primary">` formatted as "10 Jun"
- Day of week: `text-caption text-text-muted`, abbreviated 3-letter format, e.g., "Thu"
- Start time: `text-caption text-text-secondary`, e.g., "14:00"

**Center content block** (`flex-1 min-w-0`):
- Session title: `text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5`
- Course and instructor: `text-caption text-text-secondary` formatted as `{courseTitle} · {instructor}`
- Duration: `text-caption text-text-muted`, e.g., "14:00 - 15:00" (visible on `sm+`)
- Attendance caption (optional, §10.4): `text-caption text-text-muted mt-1` — "You attended this session" or "You missed this session"

**Right block** (`flex-shrink-0 flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-2`):

| Session status | Right block contents |
|---|---|
| `scheduled` | `Badge variant="default"` — "Upcoming". No action. |
| `live` (appears in flat `live` filter list) | `Badge variant="salem"` — "Live now". If `meetingUrl` present: Salem text-link "Join". If absent: badge only. |
| `completed` | `Badge variant="default"` — "Completed". If `recordingUrl` present: Salem text-link "Watch recording". |
| `cancelled` | `Badge variant="coral"` — "Cancelled". No action. |

**Salem text-link action classes:**
`text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`

**Why text-links for list row actions, not `Button` components.** This follows the established pattern in `ProgressPage.tsx` (Continue as text-link) and `CertificatesPage.tsx` (Download as text-link). Using `Button` in repeating list rows would place multiple equal-weight buttons in view simultaneously, competing with each other and with the one `Button variant="primary"` on the `FeaturedSessionRow`. Text-links serve list-row actions across all existing dashboard pages.

### 5.6 Past Sessions Section

Renders when the active filter is `all` or `past`, and at least one `completed` or `cancelled` session exists.

```tsx
<section className="mb-6" aria-label="Past sessions">
  <h2 className="text-body-sm font-medium text-text-secondary mb-3">
    Past sessions ({count})
  </h2>
  <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
    {pastSessions.map(session => (
      <LiveSessionRow key={session.id} session={session} />
    ))}
  </ul>
</section>
```

Sessions sorted by `startsAt` descending (most recent first).

**Cancelled rows.** Show only the `coral` badge. Do not show any action. Do not show a recording link. An optional brief caption `text-caption text-text-muted mt-0.5` — "This session was cancelled." may be placed below the session title for clarity. Do not add Coral or Error background fills to the row itself; the badge is the only status signal.

---

## 6. Component Reusability

### 6.1 Reuse from the existing codebase

| Component | Path | Variant / Prop | Role on Live Sessions page |
|---|---|---|---|
| `Button` | `components/ui/Button.tsx` | `variant="primary" size="sm"` | Join action on `FeaturedSessionRow` when live and `meetingUrl` present (the sole primary on the page) |
| `Button` | `components/ui/Button.tsx` | `variant="secondary" size="sm" disabled` | Join placeholder on `FeaturedSessionRow` when `meetingUrl` absent |
| `Badge` | `components/ui/Badge.tsx` | `variant="salem"` | "Live now" status badge |
| `Badge` | `components/ui/Badge.tsx` | `variant="default"` | "Upcoming" and "Completed" status badges |
| `Badge` | `components/ui/Badge.tsx` | `variant="coral"` | "Cancelled" status badge |
| `Badge` | `components/ui/Badge.tsx` | `variant="anzac"` | "Attended" (optional; see §10.4) |
| `FilterTabs` | `components/ui/FilterTabs.tsx` | generic `T extends string` | All / Live / Upcoming / Past switcher |

### 6.2 New components to create (local to the feature)

| Component | Suggested path | Extraction justification | Notes |
|---|---|---|---|
| `LiveSessionSummary` | Local to `LiveSessionsPage.tsx` or `features/dashboard/components/LiveSessionSummary.tsx` | Short stats strip; may stay inline in the page for v1 | Extract only if the strip logic grows complex or is shared with a second page |
| `FeaturedSessionRow` | `features/dashboard/components/FeaturedSessionRow.tsx` | Visually distinct from list rows; has its own shell, eyebrow, and primary action zone | Parallel to `FeaturedCourseRow` in `MyCoursesPage`; do not merge them |
| `LiveSessionList` | Local to `LiveSessionsPage.tsx` | Thin wrapper around `<ul>` with section heading; short enough to stay inline | Extract only if a second page renders the same list |
| `LiveSessionRow` | `features/dashboard/components/LiveSessionRow.tsx` | Shared between the upcoming and past sections; branches on `session.status` for right-block content | Single component, not two near-identical row components |
| `SessionStatusBadge` | Inline inside `LiveSessionRow` | Maps `LiveSessionStatus` to `Badge` variant and label; 4-line switch or object map | Extract to a named component only if the same mapping is needed in a second location |

### 6.3 Components that do not fit

| Component | Reason |
|---|---|
| `Container` | Marketing width primitive; dashboard shell uses inline `px-8 max-w-container mx-auto` |
| `SectionHeader` | Marketing header at `text-display` / `text-headline` scale; wrong for dashboard content |
| `Stat` | Renders values at `text-headline` (40px) or `text-display` (56px); built for hero metrics; the summary strip uses `text-body-sm` inline text |
| `TestimonialCard` | Social-proof composition; unrelated to live session management |
| `CourseCard` | Enrolled-course card with gradient thumbnail and progress bar; live sessions are schedule rows, not course cards |
| Hero metric grids | Named anti-pattern in `DESIGN.md`; three equal-sized stat cards in a row is the SaaS cliche the system explicitly rejects |
| Gradient text | Explicitly prohibited by `DESIGN.md` |
| Glassmorphism | Explicitly prohibited by `DESIGN.md` |
| Large Salem section backgrounds | Salem is reserved for full-bleed brand pages, not dashboard panels or card backgrounds |
| Countdown timers | Urgency theater; directly contradicts the "calm confidence" design principle in `PRODUCT.md` |
| Large decorative calendar graphics | Prohibited per task scope; the `Video` icon at 20px is the correct, restrained scale |

---

## 7. Empty, Loading, and Error States

### 7.1 Empty states

**State 1: No sessions at all.** The learner has no sessions in any status. Shown when the entire data set is empty.

```
Shell:   bg-surface border border-border-default rounded-lg p-8
Layout:  flex flex-col items-center text-center gap-3
Icon:    Video size={28} className="text-text-muted" aria-hidden="true"
Title:   "No live sessions scheduled"
         text-body-sm font-semibold text-text-primary
Body:    "Upcoming instructor-led sessions will appear here when they are available."
         text-body-sm text-text-secondary
No action. Do not link to a browse page; sessions are course-driven, not user-initiated.
```

**State 2: No results for the active filter.** The learner has session data, but the active filter matches nothing.

```
Single line, no card shell:
"No sessions match this filter."
text-body-sm text-text-muted py-10 text-center
```

**State 3: Live integration unavailable.** The backend does not support meeting URLs and `meetingUrl` is absent on live sessions.

Handle this inline per session, not as a page-level state:
- On `FeaturedSessionRow`: `Button variant="secondary" size="sm" disabled` plus caption `text-caption text-text-muted mt-1` — "Meeting link not available yet."
- On list-row Join links: omit the action entirely; show the status badge only.

Do not replace the page content with an integration notice. Show the session information that is available (title, course, instructor, time, status badge) and degrade only the unavailable join action. This is honest about what the page can and cannot do.

### 7.2 Loading state

Follow the `DashboardPageSkeleton` pattern for route-level Suspense if that pattern exists in the project. Wrap the `LiveSessionsPage` route in `<Suspense fallback={<DashboardPageSkeleton />}>` at the router level, consistent with other dashboard pages.

For future in-page data fetching (once a real API exists), use skeleton placeholders matching the final layout:
- Summary strip: `bg-surface-elevated rounded h-4 w-48 animate-pulse`
- `FeaturedSessionRow`: `bg-surface border border-border-default rounded-lg h-24 animate-pulse mb-6`
- List container: `bg-surface border border-border-default rounded-lg` with 2-3 `h-16 animate-pulse` row placeholders inside, divided by `divide-y divide-border-default`

Do not add a spinner unless one is already used consistently across other dashboard pages.

### 7.3 Error state

An inline error surface within the content column. Not a full-page takeover. Not destructive-red for a data-loading failure.

```
Shell:   bg-surface border border-border-default rounded-lg p-4
Title:   "Could not load sessions."
         text-body-sm font-semibold text-text-primary mb-1
Body:    "Please try again or check your connection."
         text-body-sm text-text-secondary mb-3
Action:  "Try again"
         Button variant="secondary" size="sm"
```

For action-scoped errors (e.g., a join link fails to open), surface the error inline below the relevant action: `text-caption text-error mt-1`. Do not replace whole-page content for a single-row action failure.

---

## 8. Accessibility Notes

**FilterTabs.** The existing `FilterTabs` component uses `role="group"` and `aria-pressed` per button. Pass `aria-label="Filter sessions"` to the component. Keyboard users navigate with `Tab` and activate with `Space` or `Enter`.

**Session action labels.** Do not use generic labels. All actions carry the session name:
- `aria-label="Join live session: Advanced React Q&A"`
- `aria-label="Watch recording: Intro to TypeScript"`
- `aria-label="Join live session: TypeScript Deep Dive"` (disabled state must still carry this label)

**Disabled actions.** Disabled buttons must carry their `aria-label`. The disabled state is communicated visually (40% opacity from `Button`) and to assistive technology (via the `disabled` attribute). A visible helper caption below explains why the action is unavailable: "Meeting link not available yet."

**Time semantics.** All displayed dates and times must be wrapped in `<time dateTime="...">` using ISO 8601 format. For example: `<time dateTime="2026-06-10T14:00:00">10 Jun, 14:00</time>`. Do not render raw date strings outside a `<time>` element.

**Status as text, not color alone.** Every badge carries both a visible label ("Live now", "Upcoming", "Completed", "Cancelled") and a color variant. Color is additive confirmation; the text is the primary signal. This satisfies WCAG 1.4.1 (Use of Color).

**List semantics.** The upcoming and past session containers use `<ul>` and `<li>` semantics. Screen readers announce the list count and navigate by item. Do not use `<div>` containers for list rows.

**Section landmarks.** Use `<section aria-label="Upcoming sessions">` and `<section aria-label="Past sessions">`. Screen readers can jump between landmarks using region navigation.

**No nested clickable containers.** `LiveSessionRow` list items are not fully clickable. Do not add `onClick` to the `<li>` shell. Keep each action as a discrete, labeled interactive element. Nesting a button or link inside a clickable container creates overlapping keyboard targets and ambiguous focus order.

**FeaturedSessionRow icon block.** The left icon block is `aria-hidden="true"` (decorative). The `Video` icon within it also carries `aria-hidden="true"`. The session title, course, instructor, and time are in the visible content block and are announced by screen readers.

**Focus rings.** All interactive elements carry `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem`. The `Button` component includes this. Custom Salem text-link actions must include the same classes explicitly.

**Minimum touch and click targets.** All interactive elements must meet `min-h-[44px]`. Apply `min-h-[44px] px-1 rounded-sm` to Salem text-link actions (Join, Watch recording) so the tap target meets the minimum without visually enlarging the element.

**Chronological list order.** The upcoming section sorts sessions by `startsAt` ascending; the past section sorts descending. This order must be preserved in the DOM, not just visually. Screen readers announce list items in DOM order.

**Reduced motion.** No entrance animations are specified on this page. Wrap all transition classes in `motion-safe:transition-*`. Skeleton loading with `animate-pulse` is `prefers-reduced-motion`-safe by default in Tailwind.

**Skip link.** `DashboardLayout` provides a "Skip to content" link targeting `#main-content`. No additional skip-link work is required on this page.

---

## 9. Design-Rule Compliance Notes

**Flat-At-Rest Rule.** No shadow at rest on any element. `FeaturedSessionRow` uses `border border-border-hover` on `bg-surface`. Session list containers use `border border-border-default`. No `shadow-*` class appears at rest. No hover-lift: session rows are not fully clickable containers.

**Forest Rule (one primary per zone).** One `Button variant="primary"` exists on the entire page: the "Join session" button on `FeaturedSessionRow`, and only when `status === 'live'` and `meetingUrl` is present. All other actions use Salem text-links or `Button variant="secondary"`. The active `FilterTab` tint (`bg-salem-50`) and the `FeaturedSessionRow` live badge (`bg-salem-50`) are tonal Salem uses, not filled-button weight. The primary button is the unambiguous highest-priority action.

**Salem surface area.** Salem appears as: `FeaturedSessionRow` live badge background (`bg-salem-50`), active FilterTab tint (`bg-salem-50`), Salem text-link actions, focus rings, and the one primary button fill when a live session is featured. No large Salem background blocks appear on any surface. Well within the 15% surface area cap.

**The Field Rule.** Coral appears only on "Cancelled" badges, a status-bearing context signaling unavailability. Anzac appears only in the optional "Attended" badge (§10.4), an achievement context. Neither Coral nor Anzac is used decoratively.

**No urgency theater.** No countdown timers. No blinking pulse on live badges. No "Starts in X minutes" animated text. The `Badge variant="salem"` with "Live now" is the correct, calm affordance. The one `Button variant="primary"` communicates priority through hierarchy, not animation.

**No large decorative calendar graphics.** The `FeaturedSessionRow` left block uses a `Video` icon at 20px. Large decorative calendar illustrations are prohibited. The `Video` icon is purely tonal and consistent with the document preview approach in `CertificatesPage`.

**No hero-metric grid.** The summary strip uses compact inline `text-body-sm` text. No `Stat` component. No value renders at `text-headline` (40px) or `text-display` (56px). The three-metric-cards-in-a-row pattern is the SaaS anti-pattern named in `DESIGN.md`.

**No accent stripes.** All container borders are full-perimeter. No `border-left` or `border-right` in color as a decorative stripe. `DESIGN.md` explicitly prohibits colored side stripes thicker than 1px on cards or list items.

**List rows over card grids.** A schedule of sessions is chronological data. List rows align with how users read schedules: scanned vertically, ordered by date. A card grid imposes spatial arrangement on temporal data, making the schedule harder to scan. This matches `ProgressPage`'s treatment of course lists.

**Type scale constraint.** The page steps `text-title` (H1, 28px) to `text-body-sm` (session titles, section headings, 14px) to `text-caption` (time, metadata, 12px). No `text-title-sm`, `text-headline`, or `text-display` inside the dashboard content column. No intermediate scale between `text-body-sm` and `text-body`.

**Professional schedule tone.** The page does not read as an event marketplace, a webinar sales page, or a gamified hub. Sessions are instructor-led learning activities. Copy uses direct language: "Live now", "Upcoming", "Completed", "Cancelled". No promotional language, no social proof (attendee counts, popularity signals), no urgency theater.

**Three-tier depth maximum.** `bg-bg-base` (page) > `bg-surface` (`FeaturedSessionRow`, list containers) > `bg-surface-elevated` (FeaturedSessionRow left block, FilterTab hover). No deeper nesting permitted.

**No em dashes in copy.** All prose uses commas, colons, semicolons, or periods.

---

## 10. Open Decisions

The following items require a decision before or during implementation. None block the spec, but each must be resolved before the relevant feature ships.

**1. Are live sessions embedded Jitsi rooms or external links?**
The spec treats `meetingUrl` as an external URL (opens in a new tab). If Jitsi integration is embedded inside the Learnova app, the "Join session" action would navigate to a full-page route or an overlay player rather than an external link. This changes the button behavior fundamentally: an internal route uses a router `Link`; an external URL uses `<a target="_blank" rel="noopener noreferrer">`. Decide before implementing the join action.

**2. Do learners register for individual sessions or see all sessions from enrolled courses automatically?**
The spec assumes learners see sessions for all enrolled courses without a separate per-session registration step. If per-session registration is required (e.g., for capacity limits), add a "Register" action for `scheduled` sessions and a `registered` attendance state. This would require a backend registration endpoint and additional UI states not currently in this spec.

**3. Are recordings supported in v1?**
The spec includes `recordingUrl` as an optional field and shows a "Watch recording" Salem text-link when present. If recordings are not a v1 feature, remove `recordingUrl` from the type model, remove the "Watch recording" action, and remove the "recordings available" metric from the summary strip. The past sessions section still renders without that action.

**4. Is attendance tracking in scope for v1?**
The spec includes `attendanceStatus` as an optional field. If attendance tracking ships in v1, show: `Badge variant="anzac"` — "Attended" (Anzac is appropriate here as a completion-achievement signal) on attended past rows; and `text-caption text-text-muted mt-1` — "You missed this session" for missed rows. If attendance tracking is not in scope for v1, remove `attendanceStatus` from the type model and omit the attendance caption.

**5. Should scheduled sessions have a "View details" action?**
The spec does not include a "View details" action on upcoming session rows because no session detail route exists. Options:

- **Option A (as specced).** No details action. The row shows time, title, course, instructor, and status badge. Honest about current capability.
- **Option B.** Add a Salem text-link "View details" that navigates to `/dashboard/live-sessions/{id}`. Requires a new detail page to be designed and implemented first.
- **Option C.** Add the link as disabled with a "Details coming soon" caption.

Recommended: Option A for v1. Add navigation when the detail route exists.

**6. Should calendar export belong in v1?**
Calendar export (ICS download or "Add to Google Calendar" link) is a natural affordance for upcoming sessions. Options:

- **Option A (recommended for v1).** Omit entirely.
- **Option B.** Add an "Add to calendar" Salem text-link on upcoming session rows; generate an ICS blob client-side from session data (no backend required). Place the action in the right block of the `LiveSessionRow` alongside the status badge, consistent with all other list-row actions.

Recommended: Option A unless calendar export is a stated learner requirement. If Option B is chosen, do not add a calendar icon button; use the Salem text-link pattern.

**7. Should the instructor session creation workflow exist before the learner page displays real data?**
The spec defines a learner-facing view only. For real sessions to appear, an instructor must be able to create and schedule them. If the instructor session management UI does not exist, the learner page will always display empty state or mock data. Prioritize the instructor session creation workflow before making the learner page data-dependent. The learner page can ship with mock data while the instructor workflow is in progress.
