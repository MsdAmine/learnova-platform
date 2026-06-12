import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/cn';
import logoWhiteUrl from '../../../assets/logo-white.png';
import logoPrimaryUrl from '../../../assets/logo-primary.png';

const NAV_LINKS = [
  { label: 'Course catalog', href: '/courses' },
  { label: 'How it works',   href: '/#how-it-works' },
  { label: 'About',          href: '/#brand-intro-section' },
] as const;

// ── Scroll detection via useSyncExternalStore ────────────────────────────────
// Reads element position on every scroll event; getBoundingClientRect is
// equivalent to IntersectionObserver for a simple above/below check.

function subscribeScroll(cb: () => void) {
  window.addEventListener('scroll', cb, { passive: true });
  return () => window.removeEventListener('scroll', cb);
}

function getScrollSnap() {
  const el =
    document.getElementById('brand-intro-section') ??
    document.getElementById('hero-section');
  if (el) return el.getBoundingClientRect().bottom <= 0;
  return window.scrollY > window.innerHeight * 0.8;
}

interface NavbarProps {
  /**
   * Pins the navbar to its solid (white background, dark links) state from
   * scroll position zero. Pages without a Salem hero (e.g. the course catalog)
   * need this; the transparent-at-top state would put white text on bg-base.
   */
  forceSolid?: boolean;
}

export function Navbar({ forceSolid = false }: NavbarProps) {
  const pastHero = useSyncExternalStore(subscribeScroll, getScrollSnap, () => false);
  const scrolled = forceSolid || pastHero;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDialogElement>(null);

  // Lock body scroll while the mobile panel is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Move focus into the panel and trap it; close on Escape
  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeMobile();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    hamburgerRef.current?.focus();
  }

  return (
    <>
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed top-0 left-0 right-0 w-full z-40',
          'h-nav-mobile md:h-nav',
          'transition-[background-color,box-shadow,border-color] duration-standard ease-standard',
          scrolled
            ? 'bg-white border-b border-border-default shadow-sticky'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <div className="w-full max-w-container mx-auto h-full px-4 md:px-12 flex items-center justify-between">
          {/* Logo — cross-fades between white and primary versions */}
          <Link
            to="/"
            className={cn(
              'relative flex-shrink-0 rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
              scrolled ? 'focus-visible:outline-salem' : 'focus-visible:outline-white',
            )}
            aria-label="Learnova – home"
          >
            {!logoError ? (
              <div className="relative h-8">
                <img
                  src={logoWhiteUrl}
                  alt="Learnova"
                  height={32}
                  className={cn(
                    'h-8 w-auto transition-opacity duration-300',
                    scrolled ? 'opacity-0' : 'opacity-100',
                  )}
                  onError={() => setLogoError(true)}
                />
                <img
                  src={logoPrimaryUrl}
                  alt=""
                  aria-hidden="true"
                  height={32}
                  className={cn(
                    'h-8 w-auto absolute inset-0 transition-opacity duration-300',
                    scrolled ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </div>
            ) : (
              <span
                className={cn(
                  'text-title-sm leading-none transition-colors duration-fast',
                  scrolled ? 'text-salem' : 'text-white',
                )}
              >
                Learnova
              </span>
            )}
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className={cn(
                  'text-body-sm font-medium',
                  'transition-colors duration-fast',
                  scrolled
                    ? 'text-text-primary hover:text-salem focus-visible:outline-salem'
                    : 'text-on-dark hover:text-white focus-visible:outline-white',
                  'rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <Button
            variant="inverted"
            size="md"
            asChild
            className={cn(
              'hidden md:inline-flex',
              scrolled ? 'focus-visible:outline-salem' : 'focus-visible:outline-white',
            )}
          >
            <Link to="/login">Login</Link>
          </Button>

          {/* Mobile hamburger */}
          <button
            ref={hamburgerRef}
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            className={cn(
              'md:hidden p-[10px] -mr-[10px] rounded-[4px]',
              'transition-colors duration-300',
              scrolled
                ? 'text-text-primary focus-visible:outline-salem'
                : 'text-white focus-visible:outline-white',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
            )}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* ── Mobile full-screen panel ──────────────────────────────────────── */}
      {/* Using <dialog open> keeps the element always in the layout so the  */}
      {/* slide transition works; inert gates interaction when visually hidden */}
      <dialog
        id="mobile-nav-panel"
        ref={panelRef}
        open
        aria-label="Navigation"
        aria-modal={mobileOpen}
        inert={!mobileOpen}
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-salem',
          'w-full h-full max-w-none max-h-none m-0 p-0 border-0',
          'transition-transform duration-standard ease-standard',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Panel header */}
        <div className="h-nav-mobile px-4 flex items-center justify-between flex-shrink-0">
          <Link
            to="/"
            className="rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Learnova – home"
            onClick={closeMobile}
          >
            {!logoError ? (
              <img
                src={logoWhiteUrl}
                alt="Learnova"
                height={32}
                className="h-8 w-auto"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-white text-title-sm leading-none">
                Learnova
              </span>
            )}
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close navigation menu"
            className={cn(
              'text-white p-[10px] -mr-[10px] rounded-[4px]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
            )}
            onClick={closeMobile}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Nav links — h3 / title size, stacked */}
        <nav
          aria-label="Mobile navigation"
          className="flex-1 flex flex-col justify-center px-8 gap-1 overflow-y-auto"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              to={href}
              className={cn(
                'text-title text-on-dark',
                'hover:text-white transition-colors duration-fast',
                'py-3 rounded-[4px]',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
              )}
              onClick={closeMobile}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Login CTA pinned to bottom */}
        <div className="px-8 pb-12 flex-shrink-0">
          <Button variant="inverted" size="md" asChild className="w-full justify-center">
            <Link to="/login" onClick={closeMobile}>
              Login
            </Link>
          </Button>
        </div>
      </dialog>
    </>
  );
}

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 6l12 12M6 18L18 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
