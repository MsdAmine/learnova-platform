import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// SectionHeader — eyebrow / title / description stack used at the top of each
// landing-page section and any product-side section that needs a labelled
// header above a content grid.
//
// Spacing follows the landing-page spec (docs/design/final-specs/landing-page.md):
//   eyebrow → title    : 12px  (mb-3 on the eyebrow span)
//   title   → description: 16px  (mt-md on the description paragraph)
//
// On-dark text hierarchy (DESIGN.md On-Dark Rule):
//   heading    : white 100%  →  text-white
//   body copy  : white 85%   →  text-on-dark       (--color-on-dark)
//   eyebrow    : white 60%   →  text-on-dark-muted  (--color-on-dark-muted)
//
// Description is capped at max-w-[560px] (≈ 65ch at 18px) per the readability
// rule in DESIGN.md §6 and the 520-560px values used throughout the landing spec.
// In center mode it is auto-centered with mx-auto.
// ─────────────────────────────────────────────────────────────────────────────

export interface SectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Short category marker rendered above the title. Sentence case recommended. */
  eyebrow?: string;
  /** Section headline. Rendered as an <h2> at headline scale (40px / 700). */
  title: string;
  /** Supporting sentence below the title. Body-lg scale, capped at 560px. */
  description?: string;
  /** Text and item alignment. Default: 'left'. */
  align?: 'left' | 'center';
  /**
   * Switches all text to the on-dark palette.
   * Use inside Salem full-bleed sections (hero, brand-intro).
   */
  onDark?: boolean;
  /** Override title type scale. Default: 'headline'. Use 'display' for hero-scale headings. */
  titleSize?: 'headline' | 'display';
}

export const SectionHeader = forwardRef<HTMLDivElement, SectionHeaderProps>(
  (
    {
      eyebrow,
      title,
      description,
      align = 'left',
      onDark = false,
      titleSize = 'headline',
      className,
      ...props
    },
    ref,
  ) => {
    const centered = align === 'center';

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col',
          centered && 'items-center text-center',
          className,
        )}
        {...props}
      >
        {eyebrow && (
          <span
            className={cn(
              'mb-3 text-[12px] font-semibold leading-none tracking-[0.08em] uppercase',
              onDark ? 'text-on-dark-muted' : 'text-text-muted',
            )}
          >
            {eyebrow}
          </span>
        )}

        <h2
          className={cn(
            titleSize === 'display' ? 'text-display' : 'text-headline',
            onDark ? 'text-white' : 'text-text-primary',
          )}
        >
          {title}
        </h2>

        {description && (
          <p
            className={cn(
              'mt-md text-body-lg max-w-[560px]',
              onDark ? 'text-on-dark' : 'text-text-secondary',
              centered && 'mx-auto',
            )}
          >
            {description}
          </p>
        )}
      </div>
    );
  },
);

SectionHeader.displayName = 'SectionHeader';
