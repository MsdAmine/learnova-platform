import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Color pairs are derived from the tonal ramps in .impeccable/design.json.
// Each variant uses the lightest ramp step for the background and a dark step
// (≥ 4.5:1 contrast against the bg) for text, consistent with the Field Rule
// and On-Dark Rule from DESIGN.md: status colors are never decorative.
//
// default  → neutral surface tint; any context
// salem    → success / active / enrolled state (Forest Focus Green)
// coral    → warning / notification (Alert Ember) — status-bearing only
// anzac    → achievement / completion (Earned Amber) — achievement-only
// azure    → informational / analytics (Scholar Blue) — data context only
// ─────────────────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'salem' | 'coral' | 'anzac' | 'azure';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-surface-elevated text-text-secondary',
  salem:   'bg-salem-50 text-salem',
  coral:   'bg-coral-50 text-coral-700',
  anzac:   'bg-anzac-50 text-anzac-700',
  azure:   'bg-azure-50 text-azure',
};

export function Badge({ variant = 'default', className, ref, ...props }: BadgeProps & { ref?: Ref<HTMLSpanElement> }) {
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full',
        'px-2.5 py-0.5',
        'text-caption font-medium leading-none tracking-[0.04em] uppercase',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
