import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AvatarSize = 24 | 32 | 40 | 56 | 80;

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Remote image URL. When present, renders the image; initials are hidden. */
  src?: string;
  /** Display name. Used for initials extraction and aria-label. */
  name?: string;
  /** Avatar diameter in px. Default: 40. */
  size?: AvatarSize;
  /** Add a 2px white ring — use when stacking avatars in a group. */
  stroke?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Initials
// ─────────────────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic color palette
//
// Pairs taken from the tonal ramps in .impeccable/design.json:
//   bg  — index 6 (light tint, readable surface)
//   text — index 0 (darkest shade, maximum contrast on that tint)
// ─────────────────────────────────────────────────────────────────────────────

const PALETTE = [
  { bg: '#9DD4BE', fg: '#03221A' }, // Salem
  { bg: '#8DA3E6', fg: '#0A1245' }, // Azure
  { bg: '#FFC2AE', fg: '#4A1308' }, // Coral
  { bg: '#EDD47D', fg: '#241D00' }, // Anzac
  { bg: '#D1D5DB', fg: '#111827' }, // Neutral
] as const;

function paletteFor(name: string): (typeof PALETTE)[number] {
  const hash = name
    .split('')
    .reduce((h, ch) => ((h << 5) - h + ch.charCodeAt(0)) | 0, 0);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// ─────────────────────────────────────────────────────────────────────────────
// Size map
//
// wh  — width / height classes (Tailwind numeric scale: 6→24px … 20→80px)
// fs  — font-size for the initials at that diameter
// ─────────────────────────────────────────────────────────────────────────────

const SIZES: Record<AvatarSize, { wh: string; fs: string }> = {
  24: { wh: 'w-6  h-6',   fs: 'text-[9px]'  },
  32: { wh: 'w-8  h-8',   fs: 'text-[11px]' },
  40: { wh: 'w-10 h-10',  fs: 'text-[14px]' },
  56: { wh: 'w-14 h-14',  fs: 'text-[20px]' },
  80: { wh: 'w-20 h-20',  fs: 'text-[26px]' },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function Avatar({ src, name, size = 40, stroke = false, className, style, ref, ...props }: AvatarProps & { ref?: Ref<HTMLSpanElement> }) {
  const { wh, fs } = SIZES[size];
  const initials  = name ? getInitials(name) : '';
  const showImage = Boolean(src);
  const showInitials = !showImage && initials.length > 0;
  const palette   = showInitials && name ? paletteFor(name) : null;

  return (
    <span
      ref={ref}
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center',
        'rounded-full overflow-hidden select-none',
        wh,
        stroke && 'ring-2 ring-white',
        // No-content fallback: neutral tint
        !showImage && !showInitials && 'bg-surface-elevated',
        className,
      )}
      style={
        palette
          ? { backgroundColor: palette.bg, color: palette.fg, ...style }
          : style
      }
      {...props}
    >
      {showImage && (
        <img
          src={src}
          alt={name ?? ''}
          draggable={false}
          className="w-full h-full object-cover"
        />
      )}

      {showInitials && (
        <span
          aria-hidden="true"
          className={cn('font-semibold leading-none', fs)}
        >
          {initials}
        </span>
      )}
    </span>
  );
}
