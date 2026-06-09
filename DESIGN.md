---
name: Learnova
description: Structured online learning platform for professional skill development
colors:
  salem: "#032117"
  salem-50: "#E8EDEB"
  salem-100: "#C9D5D0"
  salem-200: "#98AFA6"
  salem-300: "#5C7B6F"
  salem-400: "#1A3B2E"
  salem-500: "#032117"
  salem-600: "#02180F"
  salem-700: "#010E07"
  azure: "#3C57B8"
  coral: "#FF7A59"
  anzac: "#E0C03A"
  bg-base: "#F8FAFC"
  surface: "#FFFFFF"
  surface-elevated: "#F1F5F9"
  text-primary: "#111827"
  text-secondary: "#6B7280"
  text-muted: "#9CA3AF"
  border-default: "#E5E7EB"
  border-hover: "#CBD5E1"
  success: "#10B981"
  warning: "#F59E0B"
  error: "#EF4444"
  info: "#3B82F6"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.3
  title-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  button:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
  4xl: "96px"
components:
  button-primary:
    backgroundColor: "{colors.salem}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.button}"
  button-primary-hover:
    backgroundColor: "{colors.salem-400}"
    textColor: "{colors.surface}"
  button-primary-pressed:
    backgroundColor: "{colors.salem-600}"
    textColor: "{colors.surface}"
  button-inverted:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.salem}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.button}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.button}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.salem}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    typography: "{typography.button}"
  card-default:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    typography: "{typography.body}"
---

# Design System: Learnova

> **Canonical source.** This file is the single source of truth for Learnova visual design. All other branding and design documents must summarize or point back to it. Colors, typography, spacing, shadows, radii, and component behavior must not be redefined in any other file.

## 1. Overview

**Creative North Star: "The Clarity Workbench"**

Learnova's visual system is built for the professional who has chosen to learn with intent. The surface is clean because the work is serious. Whitespace is not decorative emptiness; it is the margin on a well-used desk. Every element is present because it belongs, not because it fills space, or signals effort, or performs capability.

The interface does not congratulate you for opening it. It is already arranged, already ready. The Forest Focus Green of Salem anchors action with a color that earns attention without demanding it. Inter handles information with precision, never straining for personality it doesn't need. Shadows mark layer boundaries, not importance. The system doesn't try to be impressive. It tries to be useful, and arrives at something better.

This system explicitly rejects: the bazaar-style urgency of Udemy (every surface a sale, every thumbnail a badge); the cold institutional bureaucracy of Coursera (blue-and-white as performance of authority, dense enterprise navigation); the dated clutter of Moodle (every feature surfaced at once, nothing breathes); the badge-and-XP-explosion theater of generic LMS dashboards; and the overworked SaaS aesthetic of hero-metric grids, glassmorphism cards, and gradient text used as decoration.

**Key Characteristics:**
- Forest Focus Green as the sole action anchor on neutral surfaces
- Inter at every scale, differentiated by weight and size contrast only
- Structural shadows on layer boundaries; flat within layers
- Salem carries no more than 15% of any product screen's surface area
- Generous whitespace as the primary rhythm mechanism, varied deliberately between sections
- No gradient text, no glassmorphism, no side-stripe accent borders

## 2. Colors: The Forest and the Field

The palette divides into two zones. The Forest: Salem and Azure, deep and purposeful, used for action, progress, and structure. The Field: Coral and Anzac, warm and earned, used only for status and achievement. They do not mix carelessly.

### Primary
- **Forest Focus Green** (#032117): Salem. The dominant action color. Primary buttons, progress indicators, active navigation states, success confirmations, and the full-bleed hero section on the marketing landing page. On product surfaces it occupies no more than 15% of any screen. Its rarity is its authority. OKLCH canonical: oklch(16% 0.04 162).

### Secondary
- **Scholar Blue** (#3C57B8): Azure. Reserved for data-heavy contexts: analytics panels, learning metrics charts, informational callouts, secondary highlights in dashboards. Never a button color outside analytics-specific UI. OKLCH canonical: oklch(43% 0.18 264).

### Tertiary
- **Alert Ember** (#FF7A59): Coral. Sparing accent for warning states, high-priority notifications, active streak indicators, and CTA emphasis in marketing contexts. Appears only in status-bearing contexts on product surfaces, never decoratively. OKLCH canonical: oklch(67% 0.17 34).

- **Earned Amber** (#E0C03A): Anzac. Achievement-only color. Certificate states, reward moments, completion badges. If Anzac appears outside a completion or achievement context, something is wrong. OKLCH canonical: oklch(78% 0.17 84).

### Neutral
- **Base Canvas** (#F8FAFC): The primary page background. Cool blue-tinted off-white. The lowest tier of the tonal stack.
- **Surface White** (#FFFFFF): Cards, panels, elevated containers. Placed on Base Canvas for the first tier of depth.
- **Elevated Surface** (#F1F5F9): Hover states on interactive containers, active table rows, nested panels inside cards.
- **Primary Ink** (#111827): Body text, headings, strong labels. Near-black with a cool undertone.
- **Secondary Ink** (#6B7280): Supporting text, metadata, empty state messages, sublabels.
- **Muted Ink** (#9CA3AF): Placeholder text, disabled labels, decorative separators.
- **Default Border** (#E5E7EB): Card edges, input outlines, section dividers. The lightest mark the system makes.
- **Hover Border** (#CBD5E1): Border intensification on interactive containers at hover.

### Semantic
- **Success** (#10B981): Enrollment confirmations, completion states, form validation pass.
- **Warning** (#F59E0B): Soft warnings, expiring content, attention states.
- **Error** (#EF4444): Form errors, failed operations, destructive confirmations.
- **Info** (#3B82F6): Informational banners, tooltip anchors, hint text.

### Named Rules

**The Forest Rule.** Salem is the single voice for action. One primary button per view section. If everything is Salem, nothing is.

**The Field Rule.** Coral and Anzac are earned, not applied. Coral appears when something requires the user's attention. Anzac appears when the user has completed something. Neither is available for decoration.

**The On-Dark Rule.** On Salem full-bleed sections (hero, brand-intro on the landing page), body copy uses white at 85% opacity; headings use white at 100%. Neutral Field colors are never used on Salem backgrounds.

## 3. Typography

**UI Font:** Inter (Google Fonts; `system-ui, sans-serif` fallback)  
**Logo Wordmark:** Custom script asset only. Never instantiated as a CSS font in the interface.

**Character:** Inter is the workbench itself: precise, invisible when working. The hierarchy runs on weight contrast and a 1.4x scale ratio from body up to display. There is no display face, no decorative serif layer, no contrast pairing. The typographic richness comes from spacing and proportion, not from type variety.

### Hierarchy
- **Display** (700, 56px, 1.1 line-height, -0.02em): Hero headlines only. One per page. The single loudest element in the system.
- **Headline** (700, 40px, 1.2, -0.01em): Section titles on marketing pages; primary page headers in the product app.
- **Title** (600, 28px, 1.3): Dashboard titles, panel headings, modal headers.
- **Title-sm** (600, 22px, 1.4): Card titles, sidebar section labels, step labels.
- **Body-lg** (400, 18px, 1.6): Marketing supporting copy, landing page paragraphs. Max-width 65ch.
- **Body** (400, 16px, 1.6): Default UI text, descriptions, form instructions, table content. Max-width 72ch.
- **Body-sm** (400, 14px, 1.5): Metadata, timestamps, helper text, sublabels, nav links.
- **Caption** (400, 12px, 1.5): Compliance copy, image captions, footnotes. Use sparingly.
- **Button** (600, 15px, 1.0): Button labels only. Sentence case. Never all-caps.

### Named Rules

**The Single Typeface Rule.** Inter handles every scale. No second typeface for "personality." The script wordmark lives in the logo SVG only.

**The Scale Ratio Rule.** Each step in the hierarchy is at least 1.25x larger than the one below it. Body-sm (14px) and Body (16px) represent different hierarchy levels: never introduce a 15px "in-between" for a third level in the same zone.

## 4. Elevation

Learnova uses **structural shadows** to mark layer boundaries: sticky navigation, modal surfaces, dropdowns, and floating panels carry shadows to indicate their position in the stacking order. Shadows are architectural, not decorative.

Within a layer, depth is tonal only: bg-base (#F8FAFC) carries cards on Surface White (#FFFFFF). Nested panels inside cards use Elevated Surface (#F1F5F9). No further nesting is permitted; three tiers is the maximum depth of any surface stack.

### Shadow Vocabulary
- **Sticky** (`box-shadow: 0 1px 0 #E5E7EB`): Navbar only, appears after 80px of scroll. Marks the boundary between the fixed nav and the scrolling content below. Tonal, not elevated.
- **Layer** (`box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.06)`): Dropdowns, floating menus, autocomplete panels, command palettes. Signals the surface floats above the document plane.
- **Modal** (`box-shadow: 0 20px 60px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.08)`): Dialogs and modal sheets only. Clearly distinguishable from a Layer shadow.
- **Hover-lift** (`box-shadow: 0 4px 12px rgba(0,0,0,0.10)`): Interactive cards that accept a click. Appears on hover only; not at rest. Transition: 200ms ease-out.

### Named Rules

**The Flat-At-Rest Rule.** Cards, panels, and form elements carry no shadow at rest. Shadow appears only when an element changes stacking context (dropdown, modal, sticky layer) or directly responds to a hover interaction (hover-lift on clickable cards). If you are adding a shadow to something that does not float or move, remove it.

## 5. Components

### Buttons

Buttons are **refined and purposeful**: 8px radius, controlled padding, transitions that acknowledge input without performing. Salem is the only filled-button color. One primary button per view zone.

- **Shape:** Gently curved (8px radius)
- **Sizes:** sm (13px body-sm/600, 8px 16px padding), md (14px/600, 10px 20px), lg (15px button/600, 12px 28px)
- **Primary:** Salem fill + white text. Hover: lightens to Salem 400 (#1A3B2E), 180ms ease-out. Pressed: Salem 600 (#02180F). Focus: 3px Salem ring at 3px offset. Note: when the primary base is near-black, hover must lighten (Salem 400) not darken — a darker-than-base hover is imperceptible.
- **Inverted:** White fill + Salem text. Used on Salem full-bleed sections only. Hover: Surface-elevated tint.
- **Secondary:** White fill + Default Border + Primary Ink text. Hover: border to Hover Border, subtle Surface-elevated tint.
- **Ghost:** Transparent + Salem text. Soft secondary actions. Hover: Salem tint at 6% opacity.
- **Destructive:** Error fill (#EF4444) + white text. Destructive confirmation dialogs only.
- **Disabled:** 40% opacity, cursor not-allowed, on all variants.

### Cards / Containers

Cards are a last resort. Reach for a divider, a list row, or whitespace before reaching for a card.

- **Corner style:** Gently curved (12px radius)
- **Background:** Surface White (#FFFFFF) on Base Canvas; Elevated Surface (#F1F5F9) for nested or featured panels
- **Shadow:** None at rest. Hover-lift on interactive (clickable) cards only.
- **Border:** 1px Default Border (#E5E7EB). Omit the border when the card sits on a colored (Salem) background.
- **Internal padding:** 24px default; 16px compact; 32px editorial/marketing contexts.
- **Dark variant (Salem backgrounds):** background rgba(255,255,255,0.04), border rgba(255,255,255,0.10), text in on-dark palette.

### Inputs / Fields

- **Style:** Surface White fill, 1px Default Border, 8px radius, Body (16px/400), 12px 16px internal padding.
- **Placeholder:** Muted Ink (#9CA3AF).
- **Focus:** Border shifts to Salem (#032117), no glow or outer ring. Immediate, clean signal.
- **Error:** Border to Error Red (#EF4444), error message in Body-sm below the field.
- **Disabled:** Surface-elevated background, Muted Ink text, no focus treatment.
- **No filled inputs.** All inputs are stroke-only at rest.

### Navigation (Sticky Navbar)

- **Height:** 72px desktop, 64px mobile.
- **Brand pages (Salem hero):** Transparent background; nav links at white 85% opacity; login button as inverted-primary.
- **Scrolled state on brand pages:** Gains backdrop-filter blur (4px) + `1px solid rgba(255,255,255,0.1)` bottom border after 80px scroll.
- **Product app:** bg-base background, Primary Ink nav labels, Salem for active state indicator.
- **Nav link type:** Body-sm (14px/500), sentence case. Hover: full opacity.
- **Focus ring:** 2px Salem ring at 2px offset on product pages; 2px white ring on brand pages.
- **Mobile:** Logo left, hamburger right. Full-screen Salem panel slides from right; nav links at Title scale.

### Course Cards (Signature Component)

The primary browsable unit. Appears in catalog grids and "continue learning" dashboard rows.

- **Image:** 16:9 thumbnail, radius-lg (12px), object-fit cover.
- **Body:** 16px padding, Title-sm for course name, Body-sm for instructor and category tag.
- **Progress footer (enrolled):** 4px Salem fill on gray track (surface-elevated), radius-full, percentage in Caption below.
- **No price overlays.** Learnova v1 is free; no discount-theater on thumbnails.
- **Hover:** Hover-lift shadow + image scales 102%, 200ms ease-out.

### Progress Bars

- **Track:** Surface-elevated (#F1F5F9), 4px height, radius-full.
- **Fill:** Salem (#032117) for learning progress; Scholar Blue (#3C57B8) for analytics and metrics views.
- **No label inside the bar.** Percentage text lives below, in Caption type.

## 6. Do's and Don'ts

### Do:
- **Do** use Salem (#032117) as the sole filled-button color and primary action anchor. Its authority comes from scarcity: no more than 15% of any product screen's surface.
- **Do** use whitespace as the primary rhythm mechanism. Vary padding between sections deliberately. Identical spacing everywhere is monotony.
- **Do** use tonal layering (bg-base, surface, surface-elevated) to communicate depth before reaching for a shadow.
- **Do** cap body text at 65-72ch. Wide columns on large screens are a readability failure, not a spacious layout.
- **Do** use Anzac (#E0C03A) and Coral (#FF7A59) in status-bearing contexts only: completion moments, warnings, streaks. They are earned, not applied.
- **Do** apply structural shadows (layer, modal, sticky) only to surfaces that change stacking context. Shadow means "this surface floats."
- **Do** handle `prefers-reduced-motion` on all entrance animations. The hero fade-and-lift degrades to an instant render.
- **Do** present one primary button per view zone. Secondary and ghost variants handle everything else.
- **Do** write button and nav labels in sentence case.
- **Do** give interactive cards a hover-lift shadow; give non-interactive cards nothing.

### Don't:
- **Don't** replicate Udemy's urgency patterns. No "Best Seller" badges, no countdown timers, no discount language overlaid on course thumbnails. Learnova is a professional platform, not a marketplace sale.
- **Don't** use Coursera's corporate-blue-and-white as a palette. Scholar Blue (Azure) is a secondary data-context color. It does not dominate any screen.
- **Don't** adopt Moodle-style dense enterprise layouts. Wide tables with 12-plus columns, sidebars listing 20 navigation items, and chrome that competes with content are prohibited.
- **Don't** add XP explosions, leaderboards, or trophy dashboards. Achievement states use Anzac in a contained badge. They do not trigger dopamine-spiking animations.
- **Don't** use gradient text (background-clip: text with a gradient fill). Emphasis is weight and size.
- **Don't** use glassmorphism decoratively. Backdrop blur exists only on the sticky navbar in its scrolled state and nowhere else.
- **Don't** use border-left or border-right greater than 1px as a colored accent stripe on cards, alerts, or list items. Rewrite with a full border, a background tint, or a leading icon.
- **Don't** build identical-card grids: same-sized icon-heading-text cards in a repeating 3-column grid. It is the default reflex for this category. Vary the pattern.
- **Don't** add shadow to elements at rest if they do not change stacking context. The Flat-At-Rest Rule holds everywhere except hover-lift on interactive cards.
- **Don't** use the hero-metric template: big number, small label, supporting stat, gradient accent. It is the SaaS cliché that signals AI output immediately.
- **Don't** write em dashes in UI copy. Use commas, colons, semicolons, or periods instead.
- **Don't** use Salem as an ambient background on product surfaces. It is a full-bleed decision on brand pages, not a dashboard color.
