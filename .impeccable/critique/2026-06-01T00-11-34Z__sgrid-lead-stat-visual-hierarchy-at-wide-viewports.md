---
target: StatsGrid lead stat visual hierarchy at wide viewports
total_score: 30
p0_count: 0
p1_count: 0
timestamp: 2026-06-01T00-11-34Z
slug: sgrid-lead-stat-visual-hierarchy-at-wide-viewports
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Static values; no loading state when live API replaces hardcoded stats |
| 2 | Match System / Real World | 4 | Clear professional language throughout |
| 3 | User Control and Freedom | 3 | Static section; no traps |
| 4 | Consistency and Standards | 3 | text-headline wrapper in Stat silently overridden by text-display inner span |
| 5 | Error Prevention | 3 | N/A - no user interaction |
| 6 | Recognition Rather Than Recall | 4 | Labels make intent obvious |
| 7 | Flexibility and Efficiency | 2 | No source attribution, no expandability |
| 8 | Aesthetic and Minimalist Design | 3 | Supporting-stats column narrows aggressively at lg breakpoint entry |
| 9 | Error Recovery | 3 | N/A - static content |
| 10 | Help and Documentation | 2 | Statistics carry no sourcing signal |
| Total | | 30/40 | Good |

## Anti-Patterns Verdict

LLM: Not egregiously AI-generated. Hero-metric disciplines held: no gradient accents, no centered layout, no Salem value text. Two-column offset prevents straight number-as-hero read. Structurally still hero-metric adjacent.

Detector: detect.mjs returned [] on StatsGrid.tsx. Clean pass. Zero findings.

## Overall Impression

Well-written and disciplined. Hierarchy (56px lead vs 40px supporting) is correct in principle. At the lg breakpoint entry (1024px) the supporting-stat column collapses to 156px content width. Main opportunity: tighten layout at 1024-1280px range.

## Priority Issues

P2 - Lead stat type contrast insufficient at lg breakpoint entry. At 1024-1200px, display clamps to ~51px and headline to ~37px. Ratio = 1.38x. Fix: bump flex ratio to lg:flex-[4] on lead.

P2 - Supporting-stats descriptions wrap to 3 lines at 1024px. Content area = 156px. Fix: add min-w-[200px] or suppress descriptions with hidden lg:block xl:block.

P3 - text-headline wrapper in Stat silently overridden by lead stat. Fix: add size prop to Stat component.

P3 - No credibility signal on statistics. Placeholder hardcoded values. Fix: add sourcing sub-caption.

## Persona Red Flags

Jordan: Stats read as assertions with no verification. 3-line descriptions at lg slow scanning.

Riley: landing-stats.ts confirms placeholder numbers. Aggressive description wrapping at 1024px.

Morgan (Corporate L&D Manager): 12,000+ learners reads small vs enterprise LMS context.
