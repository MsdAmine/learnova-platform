import type { Config } from 'tailwindcss';

// All values reference CSS custom properties defined in src/styles/tokens.css.
// Install Tailwind before use: npm install -D tailwindcss postcss autoprefixer
// Then add to vite.config.ts: import tailwindcss from '@tailwindcss/vite' (Tailwind v4)
// or configure postcss.config.js (Tailwind v3).

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {

      // ── Colors ───────────────────────────────────────────────────────────────
      // Usage: bg-salem, text-azure, border-border-default, etc.

      colors: {
        // Primary
        'salem':     'var(--color-salem)',
        'salem-50':  'var(--color-salem-50)',
        'salem-100': 'var(--color-salem-100)',
        'salem-200': 'var(--color-salem-200)',
        'salem-300': 'var(--color-salem-300)',
        'salem-400': 'var(--color-salem-400)',
        'salem-500': 'var(--color-salem-500)',
        'salem-600': 'var(--color-salem-600)',
        'salem-700': 'var(--color-salem-700)',

        // Secondary / Tertiary
        'azure': 'var(--color-azure)',
        'coral': 'var(--color-coral)',
        'anzac':     'var(--color-anzac)',
        'anzac-50':  'var(--color-anzac-50)',
        'anzac-700': 'var(--color-anzac-700)',

        // Neutral
        'bg-base':          'var(--color-bg-base)',
        'surface':          'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'text-primary':     'var(--color-text-primary)',
        'text-secondary':   'var(--color-text-secondary)',
        'text-muted':       'var(--color-text-muted)',
        'border-default':   'var(--color-border-default)',
        'border-hover':     'var(--color-border-hover)',

        // Semantic
        'success':   'var(--color-success)',
        'warning':   'var(--color-warning)',
        'error':     'var(--color-error)',
        'error-600': 'var(--color-error-600)',
        'error-700': 'var(--color-error-700)',
        'info':      'var(--color-info)',

        // On-dark (Salem full-bleed sections)
        'on-dark':          'var(--color-on-dark)',
        'ghost-hover':      'var(--color-ghost-hover)',
        'on-dark-muted':    'var(--color-on-dark-muted)',
        'card-dark-bg':     'var(--color-card-dark-bg)',
        'card-dark-border': 'var(--color-card-dark-border)',
        'nav-border-dark':  'var(--color-nav-border-dark)',
      },


      // ── Font Family ──────────────────────────────────────────────────────────
      // Usage: font-ui

      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },


      // ── Font Size ────────────────────────────────────────────────────────────
      // Usage: text-display, text-headline, text-body-sm, etc.
      // Each entry sets font-size, line-height, letter-spacing, and font-weight
      // exactly as specified in DESIGN.md § 3 Typography.

      fontSize: {
        'brand-display': [
          'var(--font-size-brand-display)',
          { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '500' },
        ],
        'display':  [
          'var(--font-size-display)',
          { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' },
        ],
        'headline': [
          'var(--font-size-headline)',
          { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' },
        ],
        'title': [
          'var(--font-size-title)',
          { lineHeight: '1.3', fontWeight: '600' },
        ],
        'title-sm': [
          'var(--font-size-title-sm)',
          { lineHeight: '1.4', fontWeight: '600' },
        ],
        'body-lg': [
          'var(--font-size-body-lg)',
          { lineHeight: '1.6', fontWeight: '400' },
        ],
        'body': [
          'var(--font-size-body)',
          { lineHeight: '1.6', fontWeight: '400' },
        ],
        'body-sm': [
          'var(--font-size-body-sm)',
          { lineHeight: '1.5', fontWeight: '400' },
        ],
        'caption': [
          'var(--font-size-caption)',
          { lineHeight: '1.5', fontWeight: '400' },
        ],
        'button': [
          'var(--font-size-button)',
          { lineHeight: '1', fontWeight: '600' },
        ],
      },


      // ── Line Height ──────────────────────────────────────────────────────────
      // Usage: leading-display, leading-body, etc.

      lineHeight: {
        'display':  '1.1',
        'headline': '1.2',
        'title':    '1.3',
        'title-sm': '1.4',
        'body':     '1.6',
        'body-sm':  '1.5',
        'button':   '1',
      },


      // ── Letter Spacing ───────────────────────────────────────────────────────
      // Usage: tracking-display, tracking-headline

      letterSpacing: {
        'display':  '-0.02em',
        'headline': '-0.01em',
      },


      // ── Spacing ──────────────────────────────────────────────────────────────
      // Usage: p-md, m-lg, gap-2xl, etc.
      // Extends (does not replace) Tailwind's numeric spacing scale.

      spacing: {
        'xs':  'var(--space-xs)',
        'sm':  'var(--space-sm)',
        'md':  'var(--space-md)',
        'lg':  'var(--space-lg)',
        'xl':  'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)',
      },


      // ── Border Radius ────────────────────────────────────────────────────────
      // Usage: rounded-md (buttons/inputs), rounded-lg (cards), rounded-xl (hero image)
      // These override Tailwind's defaults for the same key names intentionally —
      // the design system's radius scale replaces Tailwind's for this project.

      borderRadius: {
        'sm':   'var(--radius-sm)',
        'md':   'var(--radius-md)',
        'lg':   'var(--radius-lg)',
        'xl':   'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },


      // ── Box Shadow ───────────────────────────────────────────────────────────
      // Usage: shadow-sticky (navbar), shadow-layer (dropdowns), shadow-modal, shadow-hover-lift
      // The Flat-At-Rest Rule: only apply these to surfaces that change stacking context
      // or respond to hover. Never on elements at rest.

      boxShadow: {
        'sticky':     'var(--shadow-sticky)',
        'layer':      'var(--shadow-layer)',
        'modal':      'var(--shadow-modal)',
        'hover-lift': 'var(--shadow-hover-lift)',
      },


      // ── Transition Timing ────────────────────────────────────────────────────
      // Usage: ease-standard, ease-quick

      transitionTimingFunction: {
        'standard': 'var(--ease-standard)',
        'quick':    'var(--ease-quick)',
      },


      // ── Transition Duration ──────────────────────────────────────────────────
      // Usage: duration-fast (color/border changes), duration-standard (hover-lift),
      //        duration-entrance (hero animation)

      transitionDuration: {
        'fast':     'var(--duration-fast)',
        'standard': 'var(--duration-standard)',
        'entrance': 'var(--duration-entrance)',
      },


      // ── Keyframes ────────────────────────────────────────────────────────────
      // auth-enter:       initial page-load slide-up fade-in
      // auth-exit-left/right: outgoing panel slides out (directional)
      // auth-enter-right/left: incoming panel slides in (directional)

      keyframes: {
        'auth-enter': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'auth-exit-left': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to:   { opacity: '0', transform: 'translateX(-28px)' },
        },
        'auth-exit-right': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to:   { opacity: '0', transform: 'translateX(28px)' },
        },
        'auth-enter-right': {
          from: { opacity: '0', transform: 'translateX(28px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'auth-enter-left': {
          from: { opacity: '0', transform: 'translateX(-28px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },


      // ── Animation ────────────────────────────────────────────────────────────
      // Usage: motion-safe:animate-* (all degrade to instant at prefers-reduced-motion)

      animation: {
        'auth-enter':       'auth-enter 200ms ease-out both',
        'auth-exit-left':   'auth-exit-left 160ms cubic-bezier(0.25,1,0.5,1) both',
        'auth-exit-right':  'auth-exit-right 160ms cubic-bezier(0.25,1,0.5,1) both',
        'auth-enter-right': 'auth-enter-right 220ms cubic-bezier(0.25,1,0.5,1) both',
        'auth-enter-left':  'auth-enter-left 220ms cubic-bezier(0.25,1,0.5,1) both',
      },


      // ── Max Width ────────────────────────────────────────────────────────────
      // Usage: max-w-container (centered page content)

      maxWidth: {
        'container-prose': 'var(--container-prose)',
        'container':       'var(--container-default)',
        'container-wide':  'var(--container-wide)',
      },


      // ── Height ───────────────────────────────────────────────────────────────
      // Usage: h-nav (desktop), h-nav-mobile

      height: {
        'nav':        'var(--nav-height)',
        'nav-mobile': 'var(--nav-height-mobile)',
      },

    },
  },
  plugins: [],
};

export default config;
