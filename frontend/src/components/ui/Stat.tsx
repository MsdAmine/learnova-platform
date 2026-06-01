import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Displays a single labelled metric: eyebrow → value → description.
//
// Intentionally avoids the hero-metric template (DESIGN.md §6 Don'ts):
// no gradient accent, no centered layout, no colored value text by default.
//
// size="default" → Headline scale (40px / 700). Supporting metrics.
// size="lead"    → Display scale (56px / 700). One lead stat per section.
//
// For analytics contexts, pass Azure (#3C57B8) via className on the value.
// Used standalone or composed inside <Card variant="stat">.
// ─────────────────────────────────────────────────────────────────────────────

export type StatSize = 'default' | 'lead';

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  /** Short category label rendered above the value in eyebrow style. */
  label: string;
  /**
   * Primary metric. Accepts a string, number, or a pre-formatted node
   * (e.g. a value with a unit suffix or colour override).
   */
  value: ReactNode;
  /** Optional supporting sentence rendered beneath the value in body-sm. */
  description?: string;
  /**
   * Visual scale of the value.
   * "lead"    → text-display (56px). Reserve for one dominant stat per section.
   * "default" → text-headline (40px). All other metrics.
   */
  size?: StatSize;
}

const valueClass: Record<StatSize, string> = {
  default: 'text-headline text-text-primary',
  lead:    'text-display text-text-primary',
};

export const Stat = forwardRef<HTMLDivElement, StatProps>(
  ({ label, value, description, size = 'default', className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col min-w-0', className)} {...props}>

      {/*
       * Eyebrow — matches ds-card-eyebrow from design.json:
       * 12px / 500 / Muted Ink / 0.02em tracking / sentence case.
       * mb-2 (8px) mirrors the design.json margin-bottom: 8px spec.
       * line-clamp-1: labels are always single-line at this scale.
       */}
      <span className="mb-2 line-clamp-1 text-[12px] font-medium leading-none tracking-[0.02em] text-text-muted">
        {label}
      </span>

      {/*
       * Value — scale set by `size` prop (display or headline).
       * Primary Ink by default; override with className for azure in analytics.
       * break-words prevents long strings from overflowing flex containers.
       * No accent, no gradient (hero-metric anti-pattern).
       */}
      <span className={cn(valueClass[size], 'break-words')}>
        {value}
      </span>

      {/*
       * Description — Body-sm (14px / 400 / 1.5) in Secondary Ink.
       * mt-sm (8px) gives deliberate separation from the value above.
       */}
      {description && (
        <p className="mt-sm text-body-sm text-text-secondary">
          {description}
        </p>
      )}

    </div>
  ),
);

Stat.displayName = 'Stat';
