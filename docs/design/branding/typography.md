# Learnova Typography System

# Primary Typeface

## Inter

* Source: Google Fonts
* Usage:

  * Entire UI system
  * Dashboard layouts
  * Forms
  * Navigation
  * Cards
  * Tables

Reason:
Inter provides excellent readability for productivity-focused interfaces and modern SaaS dashboards.

---

# Logo Typography

## Learnova Wordmark

* Custom handwritten script
* Used only for branding/logo
* Never used for interface text

---

# Token Names (canonical, from DESIGN.md)

Use these exact token names when implementing UI. Sizes, weights, and line heights are authoritative.

| Token | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `display` | 56px | 700 | 1.1 | -0.02em | Hero headlines only. One per page. |
| `headline` | 40px | 700 | 1.2 | -0.01em | Section titles on marketing pages; primary page headers in the product app. |
| `title` | 28px | 600 | 1.3 | — | Dashboard titles, panel headings, modal headers. |
| `title-sm` | 22px | 600 | 1.4 | — | Card titles, sidebar section labels, step labels. |
| `body-lg` | 18px | 400 | 1.6 | — | Marketing supporting copy. Max-width 65ch. |
| `body` | 16px | 400 | 1.6 | — | Default UI text, descriptions, form instructions, table content. Max-width 72ch. |
| `body-sm` | 14px | 400 | 1.5 | — | Metadata, timestamps, helper text, nav links. |
| `caption` | 12px | 400 | 1.5 | — | Compliance copy, image captions, footnotes. Use sparingly. |
| `button` | 15px | 600 | 1.0 | — | Button labels only. Sentence case. Never all-caps. |

---

# Heading Scale Reference

The token names above replace the generic H1/H2/H3/H4 names in all implementation work.

| Old name | Token | Size | Weight |
|---|---|---|---|
| H1 | `display` | 56px | 700 |
| H2 | `headline` | 40px | 700 |
| H3 | `title` | 28px | 600 |
| H4 | `title-sm` | 22px | 600 |

---

# Body Text Reference

| Old name | Token | Size | Weight |
|---|---|---|---|
| Large Body | `body-lg` | 18px | 400 |
| Default Body | `body` | 16px | 400 |
| Small Text | `body-sm` | 14px | 400 |
| — | `caption` | 12px | 400 |

---

# Button Typography

## Primary Buttons

* Token: `button`
* Size: 15px
* Weight: 600

---

# Design Rules

* Use whitespace generously
* Avoid heavy font weights
* Use sentence case
* Keep interfaces readable and calm
* Prioritize clarity over decoration
