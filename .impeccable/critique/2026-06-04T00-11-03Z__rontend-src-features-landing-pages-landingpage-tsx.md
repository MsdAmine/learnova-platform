---
target: LandingPage (landing + dashboard)
total_score: 21
p0_count: 1
p1_count: 4
timestamp: 2026-06-04T00-11-03Z
slug: rontend-src-features-landing-pages-landingpage-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Dashboard notification bell has no badge; auth state invisible in nav |
| 2 | Match Between System and Real World | 3 | Natural terminology; Tagline placeholder breaks finished-product illusion |
| 3 | User Control and Freedom | 2 | Mobile nav escape good; no logout in dashboard; no undo on newsletter |
| 4 | Consistency and Standards | 2 | Token system rigorous; BrandIntro text-arrow links vs Journey buttons |
| 5 | Error Prevention | 2 | Newsletter validates; three dead anchor links; auth-protected routes linked from marketing |
| 6 | Recognition Rather Than Recall | 3 | Dashboard has icon+label; nav labeled; footer columns clear |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts; no batch actions |
| 8 | Aesthetic and Minimalist Design | 3 | Landing clean; footer navigation density undermines restraint |
| 9 | Error Recovery | 2 | Newsletter inline error correct; no 404 handling; dead anchors silent |
| 10 | Help and Documentation | 1 | No help system; Help center likely 404s |
| Total | | 21/40 | Acceptable with significant structural issues |

P0: Tagline placeholder in BrandIntro SplitImageCard eyebrow.
P1: Hero CTA hierarchy inverted.
P1: Three dead navbar anchor links.
P1: Journey CTA pairs link to same URL.
P1: Footer 25 links mostly non-existent; X icon is close-button shape.
