---
timestamp: 2026-05-31T21-35-12Z
slug: statsgrid-and-testimonials
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Stats have no freshness signal; "Read story" links are dead |
| 2 | Match System / Real World | 3 | Language is clear; "What people are saying" restates the heading |
| 3 | User Control and Freedom | 4 | Static sections; no control needed |
| 4 | Consistency and Standards | 2 | Two "Webflow" cards; all 5-star ratings |
| 5 | Error Prevention | 3 | Logo fallback is good; dead links are an error waiting to happen |
| 6 | Recognition Rather Than Recall | 3 | Stats use eyebrow labels; scannable |
| 7 | Flexibility and Efficiency | 2 | Three testimonials with no "view all"; no hierarchy in stats |
| 8 | Aesthetic and Minimalist Design | 2 | Both sections use banned layout patterns |
| 9 | Error Recovery | 3 | Static; logo error-handling is production-grade |
| 10 | Help and Documentation | 3 | Stats are self-explanatory |
| **Total** | | **27/40** | **Below average — specific, fixable problems** |

## Anti-Patterns Verdict

**LLM assessment:** Yes, both sections look AI-generated. StatsGrid is three white bordered rectangles on the base canvas, each containing an eyebrow label, a dominant number, and a short description — this is the hero-metric template shape regardless of the absence of gradient accents. Testimonials is a textbook identical card grid: three articles at min-h-[280px], same internal structure, same scale, no differentiation.

**Deterministic scan:** [] — no CSS-level violations detected. Problems are structural, not selector-level.

## Priority Issues

**[P0] Testimonials: identical card grid**
Three TestimonialCard elements at min-h-[280px], same structure, same weight, same size. Break the grid: one featured testimonial spanning 2 columns at larger quote scale, two supporting quotes at compact scale. Or abandon cards: display-scale pull quote for the featured item, two secondary quotes as plain text items.
Suggested: /impeccable shape Testimonials redesign

**[P1] StatsGrid: hero-metric composition**
Three bordered stat containers with dominant display-scale numbers, muted eyebrow, supporting copy. Remove the Card wrapper. Present stats as a horizontal ruled strip or introduce deliberate hierarchy: lead claim at display scale without a card, supporting figures at headline scale beside it.
Suggested: /impeccable shape StatsGrid redesign

**[P1] Copy: two Webflow cards and redundant header**
landing-testimonials.ts has company: 'Webflow' on cards 1 and 3. "What people are saying" below "Learner stories" restates the same idea. Fix: deduplicate companies, drop the description prop from SectionHeader, add an eyebrow instead.
Suggested: /impeccable clarify Testimonials copy

**[P2] Stats have no internal hierarchy**
All three stats at identical visual weight. Lead stat (learner count) should dominate; others support.
Addressed by P1 StatsGrid shape fix.

**[P2] All 5-star ratings signal fabrication**
Three identical five-star ratings. Change one to 4 in landing-testimonials.ts for credibility.

## Persona Red Flags

**Emily (corporate professional, personal upskilling):**
Reads three stats at equal weight, forms no specific belief. Notices duplicate "Webflow" company name in testimonials, reads all as fake. Moves on without converting.

**Ryan (L&D manager, team rollout evaluation):**
Needs outcome data. Stats lack context (period, benchmark). Clicks "Read story" link — href="#", nothing happens. Done.

## Minor Observations

- StatsGrid SectionHeader has no eyebrow prop; section has no framing label for scanners.
- min-h-[280px] on TestimonialCard is a magic number that will cause inconsistent footer positions with real quote length variance.
- bg-surface-elevated (Testimonials) and bg-bg-base (StatsGrid) are visually indistinguishable when adjacent. Section separation is negligible.
- Testimonial quotes lack outcome specificity; they won't convert L&D evaluators.
