# Product

## Register

split

**Brand** — marketing site, landing page, campaign pages, course catalog (public). Design IS the product here; visual impression drives conversion.

**Product** — learner dashboard, course player, instructor tools, admin panel, settings, auth flows. Design SERVES the workflow; clarity and speed matter most.

Default to **product** when the surface is ambiguous. Override to **brand** explicitly for marketing-facing routes.

## Users

**Learners** — working professionals and corporate employees on employer-sponsored or self-directed upskilling programs. They use the platform during or alongside work hours. They need to find the right course fast, track their progress without friction, and produce a certificate that means something professionally. They are not students browsing for fun; they have a job to do and limited time.

**Instructors** — domain experts (not necessarily educators by trade) creating structured courses. They need a course editor that stays out of their way, clear analytics, and confidence that their content looks professional to learners.

**Admins** — internal operators managing instructor approvals and platform health. Utility-first; they optimize for batch actions, not aesthetics.

## Product Purpose

Learnova is a structured online learning platform for professional skill development. It connects corporate learners with expert-led courses, tracks their progress, and issues certificates that carry weight with employers.

Success looks like: a learner enrolls in a course, completes it at their own pace, and earns a certificate they immediately share on LinkedIn. An instructor publishes a course in under an hour and watches learner progress without chasing anyone.

## Brand Personality

**Focused. Calm. Credible.**

Voice: friendly professional — direct but not cold, motivating but not cheerleader. The platform treats learners as capable adults who chose to be here. No buzzwords, no academic stiffness, no corporate jargon.

Emotional goals: confidence (the learner feels they are moving forward), calm (no noise, no urgency theater), and quiet pride (earning the certificate feels earned, not gamified).

## Anti-references

- **Udemy** — orange saturation, aggressive discounting language, bazaar-style catalog, "best seller" badge clutter
- **Coursera** — corporate blue-and-white bureaucratic feel, dense enterprise UI, heavy academic tone
- **Moodle** — dated enterprise density, cluttered navigation, institutional coldness
- **Generic LMS aesthetics** — progress bars with XP explosions, leaderboards as default, trophy-heavy dashboards
- **Overdesigned SaaS** — gratuitous gradients, glassmorphism as style, hero-metric stat grids

## Design Principles

1. **Calm confidence.** The interface should feel like a high-quality professional tool, not a game or a sale. Every motion, color use, and layout decision should reduce cortisol, not spike dopamine.

2. **Substance over ceremony.** Progress indicators and metrics earn their place only when they surface actionable, meaningful information. No decoration that doesn't carry meaning.

3. **Continuity across registers.** A user who arrives on the marketing landing page and registers must feel like they entered the same product, not a different app. The Salem green, Inter, and spacing rhythm must hold across both surfaces.

4. **Restraint signals trust.** Corporate learners evaluate platforms quickly on perceived maturity. Visual noise, aggressive accents, and ornamentation read as immaturity. Restraint — white space, controlled color use, clear hierarchy — reads as reliability.

5. **Hierarchy does the work.** Never rely on color alone to communicate importance. Scale, weight contrast, and spatial grouping should make the most important action on any screen obvious before color is even processed.

## Accessibility & Inclusion

- **WCAG AA** at minimum across all surfaces
- Salem (#0B6E4F) on white must meet AA for normal text — verify with contrast checker; use Salem-700 variants for body-size text
- Interactive states (focus rings, hover, active) must be visually obvious without relying on color alone
- Support `prefers-reduced-motion` — entrance animations must degrade to instant
- Never communicate information through color alone (status badges need icons or text)
- Test with keyboard-only navigation on all forms and interactive components
