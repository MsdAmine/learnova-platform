import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Variant map
//
// default  — Surface White, default border, 24px padding. General-purpose.
// elevated — Elevated Surface tint, no border. Nested panels; tonal depth
//            communicates hierarchy without shadow (Flat-At-Rest Rule).
// feature  — Surface White, default border, 32px padding. Editorial / marketing.
// stat     — Surface White, default border, 16px compact padding. Data display.
// ─────────────────────────────────────────────────────────────────────────────

export type CardVariant = 'default' | 'elevated' | 'feature' | 'stat';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  default:  'bg-surface border border-border-default p-lg',
  elevated: 'bg-surface-elevated p-lg',
  feature:  'bg-surface border border-border-default p-xl',
  stat:     'bg-surface border border-border-default p-md',
};

// ── Card ─────────────────────────────────────────────────────────────────────

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg', variantClasses[variant], className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

// ── CardHeader ───────────────────────────────────────────────────────────────
// Stacks CardTitle and CardDescription with tight 4px coupling.

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-xs', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

// ── CardTitle ────────────────────────────────────────────────────────────────
// Title-sm scale (22px / 600 / 1.4). Renders as h3 by default.

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-title-sm text-text-primary', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

// ── CardDescription ───────────────────────────────────────────────────────────
// Body-sm scale (14px / 400 / 1.5) in Secondary Ink. Renders as p.

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body-sm text-text-secondary', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

// ── CardContent ───────────────────────────────────────────────────────────────
// Semantic wrapper. No inherent styles; spacing is the consumer's responsibility.

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

// ── CardFooter ────────────────────────────────────────────────────────────────
// Horizontal action row. gap-sm (8px) between items.

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-sm', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
