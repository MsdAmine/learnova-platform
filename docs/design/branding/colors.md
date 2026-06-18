# Learnova Color System

# Brand Personality

Learnova uses a calm, modern, and productivity-oriented visual identity inspired by modern SaaS products.

The palette should feel:

* Focused
* Intelligent
* Calm
* Motivating
* Accessible

Avoid:

* Neon cyberpunk palettes
* Heavy dark themes everywhere
* Oversaturated gradients
* Corporate enterprise blues

---

# Primary Brand Colors

## Salem (Primary)

* HEX: #032117
* Scale:
  * salem-50:  #E8EDEB
  * salem-100: #C9D5D0
  * salem-200: #98AFA6
  * salem-300: #5C7B6F
  * salem-400: #1A3B2E (button hover — lighter, not darker, because base is near-black)
  * salem-500: #032117 (primary)
  * salem-600: #02180F (pressed)
  * salem-700: #010E07
* Usage:

  * Primary buttons
  * Progress indicators
  * Success states
  * Active navigation
  * Key actions
  * Full-bleed hero and brand-intro sections

## Azure

* HEX: #3C57B8
* Usage:

  * Analytics
  * Learning metrics
  * Informational UI
  * Secondary highlights

## Accent (purple/blue, restrained)

> Implemented per `docs/design/brand-refresh-purple-blue-spec.md` (Phase 1 + 2, visually approved). New family layered on top of the existing palette — does not replace Salem or Azure.

* `--color-accent-primary`: #5B5FE3 (indigo) — active/selected state fills, icons, borders. Fails AA for small text on white; non-text or large/bold text only.
* `--color-accent-primary-hover`: #4B4FC9
* `--color-accent-primary-active`: #3F42A8
* `--color-accent-soft`: #EEF0FD — tint background for accent badges, selected rows, callouts
* `--color-accent-border`: #C7CCF5 — border on accent-soft surfaces
* `--color-accent-text`: #3F42A8 — on-accent-soft text, AA-verified (~7.2:1) against accent-soft
* `--color-learning`: alias of `--color-azure` — semantic name for learning-metric contexts; shares the Azure hue rather than introducing a third blue
* `--color-learning-soft`: alias of `--color-azure-50` — reuses the existing Azure tint, no new color

* Usage:

  * Active/selected states: dashboard sidebar nav, Course Player active tab and selected lesson row
  * `accent` Badge variant: category tags, "In progress" status, "Draft" course/quiz status, Admin Approvals "Pending" status
  * `learning` ProgressBar variant: analytics/metrics-context progress bars (lesson-completion bars stay Salem)
  * Empty-state icon chips and panel borders on learning-content empty states (e.g., no quizzes yet, no live sessions yet)

* Never used for:

  * Filled button backgrounds — Salem remains the sole filled-button color
  * The focus-ring color — Salem remains the sole focus signal
  * More than one "active" indicator per view, except the narrow Course Player tab/selected-row nested-hierarchy exception documented in the spec
  * Certificates — Certificates page stays gold/neutral; accent is intentionally excluded there

* Salem still anchors all primary actions, focus rings, and completion states; this accent family never substitutes for it.
* Anzac still owns certificates/achievement/earned signals exclusively; the accent family does not appear on the Certificates page.

## Coral

* HEX: #FF7A59
* Usage:

  * Warnings
  * CTA accents
  * Streaks
  * Notifications

## Anzac

* HEX: #E0C03A
* Usage:

  * Achievement states
  * Certificates
  * Completion badges
  * Earned milestones

---

# Neutral Palette

## Background

* Primary Background: #F8FAFC
* Secondary Surface: #FFFFFF
* Elevated Surface: #F1F5F9

## Text

* Primary Text: #111827
* Secondary Text: #6B7280
* Muted Text: #9CA3AF

## Borders

* Default Border: #E5E7EB
* Hover Border: #CBD5E1

---

# Semantic Colors

## Success

* #10B981

## Warning

* #F59E0B

## Error

* #EF4444

## Info

* #3B82F6

---

# Usage Rules

* Salem should anchor primary action and progress. It should not dominate product surfaces.
* Azure should support data-heavy areas
* Coral should be used sparingly
* Anzac should reinforce rewards and progression
* Large surfaces should remain neutral

---

# Accessibility

* Maintain WCAG AA contrast
* Avoid low contrast text
* Interactive states must remain visually obvious
