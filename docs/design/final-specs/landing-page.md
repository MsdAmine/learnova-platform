# Learnova Landing Page — Final Specification

> **Reference:** `docs/design/landing-page/Landing_Page__Desktop.png` (the Figma export)
> **Depends on:** `DESIGN.md` at project root for all tokens, components, and patterns referenced below.
> **Route:** `/` (public, no auth required)
> **For Claude Code:** This spec describes what the page must look like and contain. All visual specifics (colors, type, spacing, radii) live in the design system — this file references them by name. Do not invent variants.

---

## 0. Page-level rules

| Property | Value |
|----------|-------|
| Layout | Vertical stack of full-width sections, alternating Salem and neutral backgrounds |
| Max content width | `container-default` (1200px), centered |
| Sections that are full-width Salem | 1, 2, 3 (hero, brand intro, feature grid) |
| Sections on neutral bg | 4, 5, 6, 7, 8 (journey, stats, testimonials, final CTA, footer) |
| Section padding | `py-20` desktop / `py-12` mobile (see DESIGN.md §5) |
| Inter-section dividers | None — section background change provides the separation |
| Fonts | Inter only (script font appears in the logo image asset itself) |
| Above-the-fold animation | Fade + 8px slide-up, 300ms, staggered 80ms across hero elements |
| Scroll behavior | Smooth scroll on anchor links; no scroll-jacking |

The page is **static, server-renderable, and fully accessible without JS** except for: mobile menu toggle, FAQ accordions (if added), and form interactions.

---

## 1. Navbar

**Background:** transparent, overlaid on the Salem hero section (section 2).
**Height:** 72px desktop, 64px mobile.
**Padding:** `px-12 py-5` desktop, `px-4 py-4` mobile.
**Position:** sticky from scroll y=0; gains a backdrop blur + subtle border-bottom (`1px solid rgba(255,255,255,0.1)`) after scrolling 80px.

### Layout (desktop)

```
[Logo wordmark (white) ]    [ Course catalog  How it works  About us  Resources ▾ ]    [ Login ]
```

- **Logo:** `logo-white.png` from `docs/design/branding/`, height 32px, alt="Learnova"
- **Nav links:** body-sm / 500, color `text-on-dark`, hover `#FFFFFF`, gap-8
- **Resources:** has dropdown indicator chevron; opens a 280px panel with sub-links (Blog, Help center, API reference) — defer implementation to phase 2, render as a plain link for v1
- **Login button:** primary-inverted (white bg, Salem 500 text), size `md`, label "Login"

### Mobile layout

- Logo left, hamburger icon right
- Tapping hamburger opens a full-screen Salem panel sliding from the right
- Panel contains nav links (stacked, h3 size) and the Login CTA at the bottom

### States

- Default link: `text-on-dark` (white at 85%)
- Hover/focus: white (100%), no underline
- Focus ring: 2px white outline at 2px offset

---

## 2. Hero Section

**Background:** Salem `#0B6E4F`, full width.
**Padding:** `pt-32 pb-24` desktop (extra top to account for sticky navbar), `pt-24 pb-16` mobile.
**Layout:** Two-column grid on desktop, single column on mobile.

```
| Left column (60%)               | Right column (40%)         |
| Headline + body + CTAs           | Hero image                 |
```

Grid gap: `gap-12` desktop. On mobile, image stacks below text.

### Left column

1. **Eyebrow** (optional, omit for v1)
2. **H1 headline:** "Learn what matters to you"
   - Token: `h1` (56px / 700 / 1.1 / -0.02em), color white
   - Allow line break before "matters" for visual rhythm: render as two lines
3. **Supporting paragraph:** "Learnova connects you with courses that fit your pace and goals. Find structured programs, track your progress, and earn certificates that prove what you know."
   - Token: `body-lg` (18px / 400 / 1.6), color `text-on-dark` (white 85%)
   - Max-width: 520px
   - Margin top: `mt-6`
4. **CTA row:** two buttons, `gap-3`, margin top: `mt-10`
   - Primary: "Explore" → links to `/courses` (course catalog). Inverted-primary button, size `lg`.
   - Secondary: "Register" → links to `/register`. Inverted-secondary button (transparent bg, white border at 30% opacity, white text), size `lg`.

### Right column

- **Hero image:** photo of two people learning together (matches the Figma; should be sourced from Unsplash/Pexels — see asset notes below)
- Container: radius-xl, overflow hidden
- Aspect ratio: 4:3
- Object-fit: cover
- Optional subtle border: `1px solid rgba(255,255,255,0.1)`

### Image asset

Source a stock image of "two diverse adults collaborating with a laptop, natural daylight, warm tones." Place at `frontend/src/assets/hero-collaboration.jpg`. Use `<img loading="eager">` since it's above the fold. Provide a `srcset` at 1x and 2x resolution.

---

## 3. Brand Intro Section ("Built for real learning")

**Background:** Salem `#0B6E4F` (continues directly from hero — no break).
**Padding:** `py-24` desktop, `py-16` mobile.
**Alignment:** center.

### Content

1. **Eyebrow:** "Platform" — caption token, `text-on-dark-muted`
2. **H2 title:** "Built for real learning" — h2 token, color white
3. **Supporting line:** "Browse thousands of courses across every skill level" — body-lg, `text-on-dark-muted`, max-width 520px, margin auto

Spacing: 12px between eyebrow and title, 16px between title and supporting line.

### Feature grid (4 cards, 1 row desktop, 2×2 tablet, stacked mobile)

Grid: `grid-cols-4 gap-4` desktop, `grid-cols-2 gap-4` tablet, `grid-cols-1 gap-4` mobile.
Margin top before grid: `mt-16`.

Each card uses a **dark variant** of card-feature:

| Card | Eyebrow | Title | Body | Link |
|------|---------|-------|------|------|
| 1 | "Discover" | "Find your course" | "Search by category, level, or instructor expertise" | "Browse →" |
| 2 | "Progress" | "Track every step forward" | "Watch your skills grow with clear progress tracking" | "Learn →" |
| 3 | (image card) | "Live sessions and real instructors" | "Connect with instructors in real time during live sessions" | "Join →" |
| 4 | (overflow — see below) | — | — | — |

**Note about card count:** the Figma shows 3 text cards + 1 image card making a 4-column row. Implement as:

- **Cards 1 & 2:** standard text cards — Salem-on-Salem-darker style:
  - Background: `rgba(255,255,255,0.04)`
  - Border: `1px solid rgba(255,255,255,0.1)`
  - Radius: radius-lg, Padding: p-6
  - Eyebrow: caption token, color `text-on-dark-muted`
  - Title: h4, color white
  - Body: body-sm, color `text-on-dark-muted`, margin-top 8px
  - Link: body-sm / 500, color white, with arrow icon, margin-top 24px

- **Card 3 (image card):** full-bleed image (city/coffee scene from Figma) with text overlay at bottom:
  - Container: radius-lg, overflow hidden, min-height 280px
  - Image fills container, dark gradient overlay at bottom
  - Text positioned absolutely at bottom-left, p-6

- **Card 4:** if used, mirror card 3 with a different image, OR drop card 4 and use `grid-cols-3` on desktop. Recommendation: **drop card 4** and run 3 columns for cleaner balance.

---

## 4. Learning Journey Section

**Background:** `bg-base` (#F8FAFC).
**Padding:** `py-24` desktop, `py-16` mobile.
**Pattern:** three numbered steps, each a two-column row (text + image), alternating image left/right is **not** used here — the Figma shows image-right consistently. Keep it consistent.

### Step row layout

```
| Text column (50%, vertical center) | Image column (50%) |
```

Gap: `gap-12`. Each row separated by `py-12` internal padding inside a max-w container. A `1px solid border-default` divider runs above each numbered step header.

### Step 1 — Browse courses

- **Number + label:** "1   Browse courses" — body-sm / 500, text-secondary, with a small `1` rendered as a circle (28px, salem-50 bg, salem-700 text, weight 600) — placed at top-left of the row, full-width above the two columns
- **Eyebrow:** "Start here"
- **H3:** "Search and filter by what interests you"
- **Body:** "Learnova's course catalog is organized by skill level and subject. You'll find beginner courses for those starting out and advanced programs for those pushing further."
- **CTAs:** two ghost buttons in a row — "Catalog" (primary action) and "View →" (text-only link style)
- **Image:** café/learning scene, radius-lg, aspect 4:3

### Step 2 — Enroll and learn

- **Number + label:** "2   Enroll and learn"
- **Eyebrow:** "Take action"
- **H3:** "Join a course and access all lessons immediately"
- **Body:** "Once enrolled, you own your learning path. Work through lessons at your own pace, complete quizzes when ready, and attend live sessions with your instructor."
- **CTAs:** "Dashboard" and "Start →"
- **Image:** people on couch with laptop

### Step 3 — Earn certificates

- **Number + label:** "3   Earn certificates"
- **Eyebrow:** "Finish strong"
- **H3:** "Complete your course and prove your knowledge"
- **Body:** "Finish all lessons and pass the final quiz. Your certificate is yours to keep, share, and add to your resume."
- **CTAs:** "Certificates" and "Achieve →"
- **Image:** two students collaborating outdoors

### Step CTA buttons

- Both buttons use size `md`
- Primary action: `secondary` variant (white bg, border-default) — these aren't the main page CTAs
- Secondary action: `ghost` variant with arrow

### Image notes

All three images need to be sourced as warm-toned, diverse, candid photos at 4:3 aspect ratio, ~1200×900px @ 2x. Place in `frontend/src/assets/journey-{1,2,3}.jpg`.

---

## 5. Statistics Section

**Background:** `bg-base` (continues from section 4, no break — section is just a content block).
**Padding:** `py-20`.

### Layout

Two-column header above the stat grid:

```
| Headline (50%)                                         | (empty / 50%)         |
| "Learnova is trusted by learners and instructors       |                       |
|  worldwide"                                            |                       |
```

- **H2:** "Learnova is trusted by learners and instructors worldwide" — h2 token, max-width 560px

### Stat grid

`grid-cols-3 gap-4` desktop, `grid-cols-1 gap-4` mobile, margin-top `mt-12`.

Each card uses the `card-stat` pattern from the design system:

| Label | Value | Supporting |
|-------|-------|------------|
| Active learners | 12,000+ | Students learning new skills every month |
| Published courses | 450+ | Instructors sharing their expertise |
| Certificates earned | 8,500+ | Proof of learning and achievement |

**Important:** these numbers should come from a backend stats endpoint eventually (`GET /api/v1/public/stats`). For v1, hardcode them in a constants file `src/lib/landing-stats.ts` so they're easy to swap.

---

## 6. Testimonials Section

**Background:** `surface-elevated` (#F1F5F9) — slight contrast from previous section to delineate.
**Padding:** `py-24`.

### Header

- **H2:** "Learner stories" — h2 token, left-aligned
- **Supporting line:** "What people are saying" — body, text-secondary, margin-top 8px

### Card grid

`grid-cols-3 gap-6` desktop, `grid-cols-1 gap-4` mobile, margin-top `mt-12`.

Use `testimonial-card` component from the design system. For v1, ship three testimonials:

| Company logo | Stars | Quote | Person | Role |
|--------------|-------|-------|--------|------|
| Webflow | ★★★★★ | "I found exactly what I needed. The courses are clear, the instructors are responsive, and I earned my certificate in three months." | Sarah Chen | Product manager, Tech startup |
| Relume | ★★★★★ | "Learnova made it easy to teach. The platform handles everything so I can focus on my students and their progress." | Marcus Rodriguez | Instructor, Design |
| Webflow | ★★★★★ | "The live sessions changed everything for me. I could ask questions in real time and actually understand the material." | Emma Thompson | Learner, Career transition |

**"Read story →"** link sits at the bottom of each card. For v1, link to `#` (placeholder); wire to real story pages in phase 2.

Replace placeholder logo names with real partner logos when available. Store partner SVGs in `frontend/src/assets/partners/`.

---

## 7. Final CTA Section

**Background:** `bg-base` (#F8FAFC).
**Padding:** `py-24`.
**Alignment:** centered text, with a hero image below.

### Top half (text + CTAs)

- **H2:** "Ready to begin learning" — h2 token, centered
- **Supporting line:** "Join thousands of learners already advancing their skills on Learnova today." — body-lg, text-secondary, margin-top 12px, max-width 520px, mx-auto
- **CTA row:** centered, gap-3, margin-top `mt-8`
  - Primary: "Register" → `/register`, size `lg`
  - Secondary: "Browse" → `/courses`, size `lg`, ghost variant

### Bottom half (image)

- Wide hero image, full container width, aspect 21:9, radius-xl
- Subject: focused student/learner at workspace
- Margin-top: `mt-16`

---

## 8. Footer

**Background:** `bg-base` (#F8FAFC), with a `1px solid border-default` top divider.
**Padding:** `pt-16 pb-8`.

### Layout

Top row (subscribe block):

```
| Stay in the loop                                  | [email input] [Subscribe] |
| Get updates on new courses and learning opportunities  |                       |
|                                                   | We respect your privacy   |
|                                                   | and never share your data |
```

- **Left:** "Stay in the loop" (h4) + supporting body-sm text-secondary
- **Right:** inline form with email input + Subscribe button (primary, size md); compliance line below in caption token
- Divider line below this row: `mt-12 border-t border-default`

Main footer columns (6 cols on desktop, stacks on mobile):

```
| Logo |  Platform  |  Learning   |  Instructors  |  Legal        |  Company  |
|      |  Home      |  My courses |  Create course|  Help center  |  About    |
|      |  Courses   |  Progress   |  Manage       |  Contact us   |  Careers  |
|      |  Dashboard |  Lessons    |  Analytics    |  System status|  Blog     |
|      |  Certs     |  Quizzes    |  Settings     |  Documentation|  Press    |
|      |  For inst. |  Live sess. |  Support      |  API reference|  Partners |
```

Margin-top: `mt-16`. Column gap: `gap-12`.

- Column headers: body-sm / 600, text-primary, margin-bottom 16px
- Links: body-sm / 400, text-secondary, hover text-primary, vertical gap 12px
- Logo: dark wordmark (`logo-primary.png`), 32px height

### Bottom row

`mt-16 pt-8 border-t border-default`, two-column:

```
| © 2025 Learnova. All rights reserved.    Privacy   Terms    Cookies |    [social icons] |
```

- Left: caption token, text-muted, inline separated by `·`
- Right: social icons (X, Facebook, LinkedIn, Instagram, YouTube) — Lucide brand-style icons, 18px, text-muted → text-primary on hover, gap-4

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Notes |
|------------|-------|-------|
| `sm` | ≥640px | Stat grid stays 1-col, text down-scales |
| `md` | ≥768px | Feature cards become 2-col, journey rows stay stacked |
| `lg` | ≥1024px | Full desktop layout: 2-col hero, 3-col stats, 3-col features, side-by-side journey |
| `xl` | ≥1280px | Increase max content width to container-default (1200px) |

---

## 10. Performance Budget

| Metric | Target |
|--------|--------|
| LCP | < 2.0s on 4G |
| CLS | < 0.05 |
| Total page weight (above fold) | < 400 KB |
| Hero image | WebP, < 120 KB at 2x |
| Total JS (first load) | < 80 KB gzipped |

Use Vite's `build.rollupOptions` to code-split per route. The landing page should not import any dashboard code.

---

## 11. SEO

- `<title>`: "Learnova — Learn what matters to you"
- `<meta name="description">`: "Browse structured courses, track your progress, and earn certificates on Learnova. Trusted by 12,000+ learners."
- OpenGraph image: 1200×630 export of the hero section
- `<h1>` appears exactly once (in the hero)
- All images have descriptive `alt` text — never empty unless purely decorative
- Add `application/ld+json` structured data: `Organization` and `WebSite` schemas
- Add `/sitemap.xml` and `/robots.txt` (handled outside this file)

---

## 12. Implementation Checklist for Claude Code

When generating the landing page route, the agent must:

- [ ] Confirm tokens — read `DESIGN.md` at project root before writing any styles
- [ ] Set Impeccable register to `brand` for this route
- [ ] Build sections as **separate components** under `src/components/marketing/landing/`:
  - `<Hero />`
  - `<BrandIntro />`
  - `<FeatureGrid />`
  - `<JourneyStep />` (reused 3 times with props)
  - `<StatsGrid />`
  - `<TestimonialsGrid />`
  - `<FinalCta />`
  - `<Footer />`
- [ ] Compose them in `src/features/landing/pages/LandingPage.tsx`
- [ ] Wire all CTAs to real routes (or `#` placeholder with a TODO comment)
- [ ] Add `prefers-reduced-motion` handling on hero entrance animation
- [ ] Run Lighthouse: target 95+ on Performance, Accessibility, Best Practices, SEO
- [ ] Run `/audit` and `/polish` from Impeccable before opening the PR

---

## 13. Out of Scope (v1)

These are intentionally omitted from the v1 landing page and tracked for later:

- Resources dropdown navigation
- Mobile menu animation polish (slide is OK; spring/elastic is not)
- Real testimonial pages behind "Read story →"
- Real partner logos
- A/B variant of the hero copy
- Cookie consent banner (handled in a separate compliance task)
- Pricing section (Learnova is free in v1)

---

## 14. Open Questions (resolve before implementation)

1. Should the hero supporting copy mention "free" explicitly to reduce friction on the Register CTA?
2. Should the Resources nav be removed entirely from v1 navbar to avoid empty dropdown UX?
3. Are the partner logos in testimonials fictional or do we have real partners to feature?
4. Is the "12,000+ learners" number defensible, or should we use a vaguer "thousands"?

Default answer if unanswered: take the more conservative path (mention free, remove Resources, use placeholder logos, use vague phrasing).
