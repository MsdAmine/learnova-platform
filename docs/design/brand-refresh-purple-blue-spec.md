# Brand Refresh Spec: Restrained Purple/Blue Accent System

> **Status:** Planning only. No source code, tokens, or other design docs are modified by this spec. Implementation happens in a future, separate task, in the phases described below.
>
> **Relationship to canonical docs:** `DESIGN.md` remains the single source of truth for Learnova's visual system. This spec proposes an *addition* to that system (new accent tokens layered on top of the existing palette), not a replacement of it. If this spec is approved and implemented, `DESIGN.md`, `colors.md`, and `tokens.css` should be updated together as part of Phase 1 — not before.

---

## 1. Current-State Summary

Learnova's product surfaces ("Clarity Workbench" system, per `DESIGN.md`) are intentionally neutral: Base Canvas (`#F8FAFC`), Surface White (`#FFFFFF`), and Elevated Surface (`#F1F5F9`) carry almost every screen, with Salem (deep forest green, `#032117`) reserved as the sole action/progress anchor and capped at 15% of any screen's surface area. This restraint is a deliberate design principle, not an oversight — it is what currently signals "calm, credible, professional tool" rather than "marketing site" or "game."

The frontend survey (component primitives + 12 pages/areas) confirms this is working as designed, but also surfaces a real flatness:

- **Salem does almost all the work.** Active nav/tab states, selected lesson rows, primary buttons, focus rings, links, and progress fills are *all* Salem or a Salem tint (`bg-salem-50`). There is no second "live" color in the system to distinguish, say, "this is the active thing" from "this is a primary action" — they look the same.
- **Azure is defined but nearly unused.** `#3C57B8` (Scholar Blue) exists in tokens and is earmarked for "analytics, learning metrics, informational UI" in `DESIGN.md`/`colors.md`, but in practice it appears in exactly one place today: the admin role badge on `SettingsPage`. It is the system's most under-leveraged asset.
- **Status/achievement color (Anzac, Coral) is correctly scarce.** This is by design and should stay scarce — these are not candidates for expansion.
- **Cards, panels, and list rows are uniformly neutral.** `bg-surface border border-border-default` repeats across catalog cards, course detail side panels, dashboard cards, progress rows, certificate cards, live session rows, instructor course rows, and admin request rows, with no surface differentiation between "this is a static container" and "this is where learning/progress is happening."
- **No visual register for "this is a learning/progress moment."** Lesson completion, quiz results, in-progress course tracking, and the certificates strip all render in the same green-on-white or gold-on-white vocabulary used everywhere else; there is no distinct "this is the learning layer" treatment.

This is not a broken design — it is a *successfully restrained* one that has room to add a second, complementary voice without compromising the restraint. The goal of this spec is a controlled evolution: keep every existing principle (neutral dominance, Salem scarcity, flat-at-rest cards, no color-only meaning) and layer in a small purple/blue accent system that gives the product a more distinct "learning platform" identity, primarily by finally putting Azure-adjacent blue/indigo to work.

---

## 2. Design Direction

**"Calm educational SaaS with restrained purple/blue accents."**

### Preserve (no change)
- Spacious layouts, generous whitespace as the primary rhythm mechanism
- Inter at every scale, current type hierarchy and scale ratios
- Clean, flat-at-rest cards; structural-only shadows (sticky/layer/modal/hover-lift)
- Salem as the sole filled primary-button color and the dominant action anchor
- Professional, non-gamified product UI; no XP/trophy/streak theater
- WCAG AA accessibility floor
- Restrained motion (existing durations/easings; `prefers-reduced-motion` support)
- Neutral base surfaces (`bg-base`, `surface`, `surface-elevated`) as the dominant tonal stack

### Add (the refresh)
- A small purple/blue **accent** family, used for *secondary* emphasis — never replacing Salem as the primary action color
- Soft accent-tinted backgrounds for active/selected states (sidebar nav, selected lesson, active tab) as an alternative to today's Salem tint, so the "active" register is visually distinct from the "primary action" register
- A "learning" semantic color for progress/learning-specific moments (in-progress badges, learning-metric callouts) distinct from Salem (completion) and Anzac (achievement)
- Light accent backgrounds in a small number of selected spots: dashboard "Continue Learning" featured card, empty-state icon backgrounds, info/learning callouts
- Small, purposeful accent touches on: badges (info/in-progress states), icons (info/learning context), progress indicators (learning-context bars, as already partially specified for Azure in `DESIGN.md` §5), section highlights (e.g., "Live now" indicator)
- Expanded, intentional use of the existing-but-dormant Azure token family, rather than introducing an unrelated new hue from nothing

This direction does not touch hero sections, marketing copy, or layout structure. It is a color-system and component-state addition only.

★ Insight ─────────────────────────────────────
The most important finding from the codebase survey is that the palette already contains a half-used blue (Azure, #3C57B8) explicitly reserved for "analytics, learning metrics, informational UI" in DESIGN.md — but the only place it currently renders is one admin badge. This is the cheapest, lowest-risk path to "more purple/blue energy": activate an already-sanctioned color rather than inventing a new one, which sidesteps the harder problem of reconciling a brand-new hue against Salem's existing authority.
─────────────────────────────────────────────────

---

## 3. Color Proposal

Anchor the new accent family on **indigo/blue-violet**, sitting adjacent to (and harmonizing with) the existing Azure blue, rather than introducing an unrelated hue. Azure itself is kept and repositioned slightly: it becomes the system's "info/analytics" color (as already specified), while a new indigo accent becomes the "interactive learning accent" — the color used for active/selected/hover states that need to feel different from Salem.

| Role | Proposed value | Notes |
|---|---|---|
| Primary accent (learning/interactive) | `#5B5FE3` (indigo, blue-violet) | New. Active states, selected nav/tab indicators, focus-adjacent emphasis. Sits at oklch ≈ 53% 0.19 280 — saturated enough to read as "color" against neutral grays, not neon. |
| Secondary accent | `#3C57B8` (existing Azure) | Unchanged hex. Re-confirmed as analytics/info/learning-metrics color per existing `DESIGN.md` §2 "Secondary" definition. No new token needed for the base color — only new tint/border companions (see below). |
| Soft background tint | `#EEF0FD` (indigo-50) | New. Background for accent badges, selected nav row, info callouts. Must pair only with dark text (see contrast table below), never with white text. |
| Border tint | `#C7CCF5` (indigo-200) | New. 1px borders on accent-tinted cards/callouts, replacing `border-default` only where an accent surface is used. |
| Hover state | `#4B4FC9` (indigo, ~10% darker) | New. Hover on accent-colored interactive elements (e.g., accent ghost-button hover, accent badge hover if interactive). |
| Active/pressed state | `#3F42A8` (indigo, ~20% darker) | New. Pressed state for any interactive accent element. |
| Focus ring color | Salem (unchanged) | **Do not introduce a second focus-ring color.** Per DESIGN.md's Input/Button focus spec, Salem remains the universal focus signal across the app. Changing focus-ring color per element would violate "no color-only meaning" and create inconsistent keyboard-navigation feedback. This is a deliberate non-change. |
| Info/learning state color | `#3C57B8` (Azure, unchanged) + new `learning` semantic alias | "Learning" and "info" share the Azure hue family; see token strategy below for why this is one semantic concept with two names rather than two colors. |

**Warning against overuse:** the indigo accent must never appear as a filled primary-button background, never as a full-bleed section background, never on more than one "active" indicator per view, and never stacked with Salem in the same component (e.g., a card must not have both a Salem border and an indigo background). If an accent surface and a Salem surface would otherwise be adjacent in the same component, prefer dropping the accent rather than doubling color signals.

**Contrast verification (WCAG AA, normal text ≥ 4.5:1):**
- `#5B5FE3` on `#FFFFFF` background: ~3.9:1 — **fails AA for normal text**, passable only for large text (≥24px/700 weight, 3:1 threshold) or as a non-text element (icon, border, fill). Use this color for icons, borders, fills, and large bold text only — never small body text.
- Dark indigo text on soft tint: use a darker indigo text color (e.g., `#3F42A8` or darker) on `#EEF0FD` background for any badge/label text — verify ≥ 4.5:1 at implementation time with the actual chosen text shade, the same pattern already used for `coral-700` on `coral-50` and `anzac-700` on `anzac-50` in the existing token set.
- This mirrors the existing pattern in `tokens.css` (`--color-coral-700` / `--color-anzac-700` as "on-surface text" pairs for their respective `-50` tints) — the new accent needs an equivalent `indigo-700`-style on-tint text color, to be finalized in Phase 1 against a contrast checker, not guessed here.

No neon saturation, no full-app purple wash, no heavy gradients — the accent is a fill/border/text color used in small, specific places, exactly like Coral and Anzac are today.

---

## 4. Token Strategy

**Strategy: add a small number of new semantic accent tokens; do not rename or remove any existing token.**

This is the safest of the three options (replace / add-new-names / add-while-keeping-stable) because:
- Every existing component (`Button`, `Badge`, `Card`, `ProgressBar`, `Input`, and all 12 surveyed pages) references current token names directly (`bg-salem`, `text-salem`, `bg-azure-50`, etc.). Renaming any of them risks a wide, hard-to-fully-verify blast radius across the frontend with no functional benefit.
- The existing token file (`frontend/src/styles/tokens.css`) already follows a clear naming convention (`--color-{name}`, `--color-{name}-{shade}`, `--color-{name}-{shade}-text` informally via `-700` suffixes) that new accent tokens can extend without friction.
- Azure's *base* color and name are correct and stay exactly as-is; only new tint/border/hover/active companions are added around it, plus one new hue (indigo) for the interactive-accent role.

Proposed new tokens (exact final hex values to be confirmed against a contrast checker in Phase 1 — values above are the working proposal):

```
--color-accent-primary:        #5B5FE3   /* indigo — active/selected states, learning-accent fills */
--color-accent-primary-hover:  #4B4FC9
--color-accent-primary-active: #3F42A8
--color-accent-soft:           #EEF0FD   /* tint background for accent badges, selected rows, callouts */
--color-accent-border:         #C7CCF5   /* border for accent-soft surfaces */
--color-accent-text:           #3F42A8   /* on-accent-soft text, AA-verified against --color-accent-soft */

--color-learning:              var(--color-azure)      /* alias — semantic name for learning-metric contexts */
--color-learning-soft:         var(--color-azure-50)   /* already exists; reused, not duplicated */
```

`--color-learning` and `--color-learning-soft` are intentionally aliases of the existing Azure tokens rather than new colors — this keeps "analytics" and "learning progress" visually unified (both blue) per the original `DESIGN.md` intent for Azure, while giving implementation code a more semantically obvious name to reach for in learning-progress contexts (e.g., a learner's per-course analytics callout) without inventing a third blue.

Tailwind config (`frontend/tailwind.config.ts`) additions follow the existing pattern exactly — each new CSS variable gets one entry in `theme.extend.colors`:

```
'accent-primary':        'var(--color-accent-primary)',
'accent-primary-hover':  'var(--color-accent-primary-hover)',
'accent-primary-active': 'var(--color-accent-primary-active)',
'accent-soft':           'var(--color-accent-soft)',
'accent-border':         'var(--color-accent-border)',
'accent-text':           'var(--color-accent-text)',
'learning':              'var(--color-learning)',
'learning-soft':         'var(--color-learning-soft)',
```

No existing token name, value, or usage site changes. `Badge`'s existing `azure` variant is untouched; a new `accent` variant is added alongside it, following the same pattern as the existing `salem`/`coral`/`anzac`/`azure` variants.

---

## 5. Component Usage Rules

| Component | Where color goes | Where it must stay neutral |
|---|---|---|
| **Primary buttons** | No change. Salem fill remains the only filled-button color, per the existing Forest Rule. | Never apply accent-primary as a button fill. |
| **Secondary buttons** | No change to fill (`bg-surface` + `border-default`). Optional: on hover, secondary buttons used specifically inside an accent-context panel (e.g., a learning-metrics callout) may use `border-accent-border` instead of `border-hover` — narrow, contextual exception only. | Default secondary button hover (`border-hover`) is unchanged everywhere else. |
| **Links** | No change. Salem remains the link color system-wide (`text-salem hover:text-salem-400`). | Do not introduce accent-colored links; this would create two link colors in the same view and violate "hierarchy does the work." |
| **Active sidebar/nav state** | New: active nav item gets `bg-accent-soft text-accent-text` instead of today's implicit Salem-adjacent treatment, *only* in the learner/instructor dashboard sidebar nav (not the marketing navbar, which keeps Salem per the Brand-pages spec in DESIGN.md §5 Navigation). | Marketing navbar (brand pages) keeps its existing Salem-based active/scrolled treatment unchanged. |
| **Badges** | New `accent` badge variant (`bg-accent-soft text-accent-text`), used for "in progress," "pending," "info" semantic states that are not yet success (Salem/green) or achievement (Anzac/gold). | Existing `salem`/`coral`/`anzac`/`azure` badge variants and their semantic meanings (success, warning, achievement, analytics) do not change. |
| **Course cards** | At rest: unchanged (`bg-surface border-border-default`, no shadow). Optional accent: a thin `border-accent-border` (replacing `border-default`) only on a card explicitly marked "featured" or "recommended," if/when such a concept exists — not a blanket card change. | Default catalog/dashboard course cards stay fully neutral; hover-lift shadow behavior unchanged. |
| **Dashboard stat cards** | Numbers stay `text-text-primary` (no accent on the number itself, per the existing hero-metric anti-pattern rule). An accent may be used only on a small icon or label chip next to the stat, never the number. | Do not recreate the "hero-metric" pattern (big colored number + gradient) explicitly forbidden in `DESIGN.md` §6 Don'ts. |
| **Progress bars** | New optional variant: `bg-learning` fill for learning-metrics/analytics-context progress bars (this is literally what DESIGN.md §5 Progress Bars already specifies for "analytics and metrics views" — currently unimplemented). Learner lesson-completion progress bars keep Salem fill. | Do not add a third progress-bar color; only Salem (learning completion) and Learning/Azure (analytics) exist. |
| **Empty states** | Empty-state icon may sit in an `bg-accent-soft` circular chip instead of plain gray, for empty states specifically related to learning content (e.g., "no quizzes yet," "no live sessions yet"). Error/destructive empty states keep neutral or error coloring. | Empty states for admin/instructor utility screens (e.g., "no pending approvals") stay neutral — accent is for learner-facing learning moments, not utility lists. |
| **Alerts/info panels** | `info` semantic alerts may use `bg-accent-soft border-accent-border text-accent-text` instead of plain neutral, giving informational callouts (e.g., "Quiz attempt in progress") a distinct, recognizable treatment from warning/error alerts. | Warning (`warning`/Coral-adjacent) and error alerts keep their current red/orange treatment unchanged — never recolor a warning or error as accent-blue. |
| **Learner course player** | Selected-lesson row may shift from `bg-salem-50 text-salem` to `bg-accent-soft text-accent-text`, freeing Salem-tint exclusively for "completed" states and making "currently viewing" visually distinct from "done." Tab active indicator may use `border-accent-primary text-accent-text` instead of `border-salem text-salem`, for the same reason. | Quiz pass/fail badges keep current Salem (pass) / Coral (fail) semantics — do not touch pass/fail color meaning. |
| **Instructor pages** | Status badges may gain an `accent` variant for "Draft" (currently plain `default` neutral) to give draft courses a touch more visual presence than a flat gray badge, while "Published" stays Salem. | Publish/Archive action buttons stay Salem (primary) / neutral (secondary) — no accent buttons in instructor course management. |
| **Admin pages** | "Pending" approval status may use the new `accent` badge variant instead of plain `default`, distinguishing pending from rejected (error/coral) and approved (Salem/success) at a glance. | Approve/Reject action buttons unchanged (Salem primary / neutral or destructive secondary). |
| **Live sessions page** | A small "Live now" indicator (when a session's start time has passed and end time has not) may use `bg-accent-soft text-accent-text` as a subtle status chip — net new functionality note: this status concept does not exist yet in the current implementation and would need a small logic addition, not just a style change, if pursued. | Join button stays Salem primary; session list rows stay neutral. |
| **Certificates page** | No accent. Certificates are an Anzac (achievement/gold) context per existing design language; introducing blue here would dilute the "earned" signal. Keep certificate cards as proposed in the survey: neutral, with Anzac reserved for the icon/badge only if/when added. | Do not add accent-blue to certificates under any circumstance — this conflicts with the Field Rule (Anzac is achievement-only, and mixing accent with achievement muddies meaning). |

---

## 6. Page-Level Application Plan

| Page | Current issue | Proposed color touch | Risk | Implementation notes |
|---|---|---|---|---|
| Public landing/marketing | Not yet built out with accent in mind; currently Salem-led per brand-page spec. | None in this refresh — marketing/brand pages are explicitly out of scope (per anti-goal: "not a marketing-style interface inside product pages" cuts the other way too — don't import product accents into brand pages without separate review). | Low (no change) | Defer to a future, separate brand-page review if desired. |
| Catalog (`CourseCatalogPage`) | All course cards visually identical; no hierarchy beyond content. | Optional accent border on a "featured" card concept only if/when that concept is introduced; otherwise no change. | Low | No change needed unless a featured-course concept exists; do not invent one just to use the accent. |
| Course detail (`CourseDetailPage`) | "Enrolled" badge uses Salem, same as primary actions — slightly ambiguous. | Leave as-is; Salem-for-enrolled is a success signal and is consistent with the Success semantic. No accent needed here. | Low | No change recommended. |
| Learner dashboard (`LearnerDashboard`) | "Continue Learning" featured card has no visual distinction from other cards despite being the most important card on the page. | Add `border-accent-border` (replacing `border-default`) and/or a small `bg-accent-soft` chip behind the "Continue" label/icon on this one featured card. | Medium | Single card, single page — easy to scope and visually test in isolation. |
| Progress page (`ProgressPage`) | "In progress" rows look identical to "not started" rows aside from the bar fill level. | Add `accent` badge variant for "In progress" status, distinct from `anzac` "Done" and neutral "Not started." | Low | Pure badge-variant swap; no layout change. |
| Course player (`CoursePlayerPage`) | Salem used for both "primary action" and "currently selected," causing overload; selected-lesson tint and active-tab indicator are visually identical to "completed" signals. | Selected-lesson row and active-tab indicator move to `bg-accent-soft`/`border-accent-primary`; completion checkmarks keep Salem. | Medium | Touches a frequently-used page; verify the lesson list still reads clearly with two colors (accent = "viewing," Salem = "done"). Test with a learner who has several completed lessons and one selected. |
| Certificates page (`CertificatesPage`) | None — currently neutral, correctly so. | No accent. See component rule above. | N/A | No change. |
| Live sessions (learner) | No visual distinction for sessions that are starting soon or currently live. | Optional `accent` "Live now" chip (new logic + new style); otherwise no change. | Medium (new logic, not just style) | Treat as a stretch goal in Phase 3; requires a small status-derivation function, not just CSS — flag for product sign-off, not pure design. |
| Settings page (`SettingsPage`) | Admin role badge already uses Azure; otherwise neutral. | No change — Azure admin badge already does the "blue means special context" job well. | Low | No change. |
| Instructor courses (`InstructorCoursesPage`) | "Draft" status badge is flat neutral `default`, same visual weight as a disabled/empty state. | Swap "Draft" badge from `default` to `accent` variant. | Low | Pure badge-variant swap. |
| Instructor content builder (`InstructorCourseContentPage`) | Entirely neutral; no states needing emphasis beyond existing edit/delete affordances. | No accent — this is a utility editing surface, not a learning moment. | Low | No change. |
| Instructor quizzes (`InstructorQuizzesPage`) | Neutral throughout; quiz status (draft/published/archived) likely mirrors course status badges. | If a "Draft" quiz badge exists with the same neutral pattern, apply the same `accent` badge swap for consistency with course status. | Low | Confirm exact current badge variant before implementing; keep parallel to InstructorCoursesPage treatment. |
| Instructor live sessions (`InstructorLiveSessionsPage`) | No visual distinction between scheduled/cancelled sessions beyond text. | Optional: "Scheduled" sessions could use a neutral or accent badge to differentiate from a greyed-out "Cancelled" row; low priority. | Low | Defer to Phase 3 alongside the learner live-sessions page; keep both pages' treatment consistent. |
| Admin approvals (`AdminInstructorApprovalsPage`) | "Pending" requests have no distinct badge from other states in the current implementation. | Add `accent` badge for "Pending," keep Salem for "Approved," keep error/coral for "Rejected." | Low | Pure badge-variant addition; verify against actual current badge logic before implementing (survey was based on partial view of this page). |

---

## 7. Accessibility and Contrast Requirements

- **WCAG AA minimum** for all new accent usage: ≥ 4.5:1 for normal text, ≥ 3:1 for large text (≥24px/700) and for non-text UI components (borders, icon strokes, focus indicators) per WCAG 1.4.11. The proposed `accent-primary` (#5B5FE3) fails 4.5:1 against white and must only be used as a non-text element or paired with the dedicated `accent-text` (darker) shade for any text use.
- **Focus-visible:** unchanged — Salem remains the universal focus-ring color (3px ring, 3px offset per existing tokens). No new focus-ring color is introduced by this refresh, to avoid inconsistent keyboard-navigation signaling across the app.
- **No color-only meaning:** every new accent badge/status (e.g., "in progress," "pending," "Live now") must carry a text label or icon, never rely on the tint alone — this is already the pattern for existing badges (`salem`/`coral`/`anzac` all carry text) and must hold for the new `accent` variant too.
- **Dark text on soft accent backgrounds:** every `bg-accent-soft` usage must pair with `text-accent-text` (or `text-text-primary`, whichever is verified to pass AA against `#EEF0FD`) — never white or light text on the soft tint.
- **Reduced visual noise:** accent usage is capped per the component/page tables above — no page should gain more than 1-2 new accent touches; if a page-level review finds three or more new accent elements competing for attention, scale back rather than add a rule to "balance" them.
- **Test viewports:** all new accent treatments must be visually verified at 390×844 (mobile), 768×1024 (tablet), and 1440×900 (desktop) before sign-off, with particular attention to badge text wrapping and sidebar active-state legibility at the mobile width.

---

## 8. Anti-Goals (explicitly forbidden)

- Neon or cyberpunk-saturated palettes
- Childish or playful colors
- Rainbow or multi-hue gradients
- Heavy background gradients on any product (non-marketing) page
- Glassmorphism, anywhere outside the already-existing scrolled-navbar blur on brand pages
- Card shadows at rest (the Flat-At-Rest Rule is unaffected by this refresh)
- Fake stats, fake metrics, or invented numbers anywhere in the UI
- Gamified XP/trophy/streak/leaderboard language or visuals
- Fake or exaggerated progress/learning claims
- Any change to backend behavior, API contracts, or business logic
- Any change to the certificates backend or certificate-issuance logic
- A second focus-ring color
- Accent color on more than one "active" indicator per view
- Accent and Salem treatments stacked on the same component

---

## 9. Implementation Phases

**Phase 1 — Tokens and primitives**
- Add new CSS variables to `tokens.css` (accent-primary/-hover/-active/-soft/-border/-text, learning/-soft aliases)
- Add corresponding entries to `tailwind.config.ts`
- Add new `accent` variant to `Badge`
- Update sidebar/nav active state and focus-adjacent primitive states only (no page-level work yet)
- Update button focus-ring behavior only if a contrast issue is found during this phase — otherwise no button change
- Finalize and contrast-verify exact hex values for `accent-text` against `accent-soft`
- Sync `DESIGN.md`, `colors.md`, and `tokens.css` documentation together once values are finalized

**Phase 2 — Learner-facing surfaces**
- Apply accent to: Learner dashboard "Continue Learning" card, Progress page "In progress" badge, Course Player selected-lesson row and active-tab indicator
- Catalog/course-detail: only if a featured-course concept is introduced; otherwise skip

**Phase 3 — Instructor, admin, and live-session surfaces**
- Instructor "Draft" status badge swap (courses, and quizzes if applicable)
- Admin "Pending" approval badge
- Live sessions "Live now" indicator (learner + instructor pages) — flag the new status-derivation logic for product review before styling

**Phase 4 — Final visual QA and docs sync**
- Full visual pass at all three required viewports across every page touched in Phases 1-3
- Re-run accessibility contrast checks on every shipped accent usage
- Update `CURRENT_STATE.md` to reflect the refresh's completion
- Confirm `DESIGN.md`/`colors.md`/`tokens.css` are fully in sync with shipped values

---

## 10. Verification Plan for Future Implementation

Commands (run from `frontend/`):
```bash
cd frontend
npm run lint
npm run build
npm run test
```

Browser QA viewports:
- 390×844 (mobile)
- 768×1024 (tablet)
- 1440×900 (desktop)

Visual QA checklist:
- No horizontal overflow introduced at any viewport
- No low-contrast text (verify every new `accent-text`-on-`accent-soft` pairing with a contrast checker, not by eye)
- No excessive color saturation — accent should read as "a little blue," not "a blue app"
- Nav active state is clearly visible and distinct from hover state
- Focus rings remain visible and consistent (Salem) on every interactive element touched
- Cards remain calm and readable — no card should look "busier" after the refresh than before

---

## 11. Next Implementation Task

Recommended next step: **implement Phase 1 only.**

Scope: token additions to `tokens.css` and `tailwind.config.ts`, the new `accent` Badge variant, and the sidebar/nav active-state primitive update. No page-by-page rewrites, no live-session status logic, no catalog/featured-course concept. This keeps the first implementation PR small, reviewable, and fully reversible if the accent reads wrong in practice — exactly the kind of controlled, low-risk first step the rest of this spec's phasing is built around.
