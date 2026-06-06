import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../ui/Container';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/cn';
import logoPrimaryUrl from '../../../assets/logo-primary.png';

const NAV_COLUMNS = [
  {
    label: 'Platform',
    links: [
      { label: 'Home',         to: '/' },
      { label: 'Courses',      to: '/courses' },
      { label: 'Dashboard',    to: '/dashboard' },
      { label: 'Certificates', to: '/certificates' },
    ],
  },
  {
    label: 'Learning',
    links: [
      { label: 'My courses',    to: '/dashboard/courses' },
      { label: 'Progress',      to: '/dashboard/progress' },
      { label: 'Live sessions', to: '/dashboard/live-sessions' },
      { label: 'Settings',      to: '/dashboard/settings' },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: 'Follow us on X (Twitter)', href: 'https://x.com/learnova',               Icon: IconX },
  { label: 'Follow us on Facebook',    href: 'https://facebook.com/learnova',         Icon: IconFacebook },
  { label: 'Connect on LinkedIn',      href: 'https://linkedin.com/company/learnova', Icon: IconLinkedin },
  { label: 'Follow us on Instagram',   href: 'https://instagram.com/learnova',        Icon: IconInstagram },
  { label: 'Watch on YouTube',         href: 'https://youtube.com/@learnova',         Icon: IconYoutube },
] as const;

function validateEmail(value: string): string {
  if (!value.trim()) return 'Email address is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address.';
  return '';
}

export function Footer() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    // TODO: wire up to mailing list / newsletter API
    setSubmitted(true);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value);
    if (error) setError('');
  }

  return (
    <footer
      aria-label="Site footer"
      className="w-full bg-bg-base border-t border-border-default pt-16 pb-8"
    >
      <Container>

        {/* ── Subscribe block ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start">
          <div>
            <h4 className="text-title-sm text-text-primary">Stay in the loop</h4>
            <p className="mt-2 text-body-sm text-text-secondary">
              Get updates on new courses and learning opportunities.
            </p>
          </div>

          <div>
            {submitted ? (
              <output className="flex items-start gap-3 py-1">
                <IconCheck />
                <span>
                  <span className="block text-body-sm font-semibold text-text-primary">You're on the list.</span>
                  <span className="block mt-1 text-caption text-text-muted">You'll hear about new courses and opportunities as they go live.</span>
                </span>
              </output>
            ) : (
              <form onSubmit={handleSubscribe} noValidate aria-label="Newsletter subscription">
                <label
                  htmlFor="newsletter-email"
                  className="block mb-2 text-body-sm font-medium text-text-primary"
                >
                  Email address
                </label>
                <div className="flex gap-3">
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="you@company.com"
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    required
                    className={cn(
                      'flex-1 min-w-0',
                      'bg-surface text-text-primary rounded-md',
                      'border',
                      error ? 'border-error' : 'border-border-default',
                      'text-body px-4 py-3',
                      'placeholder:text-text-muted',
                      error ? 'focus:border-error' : 'focus:border-salem',
                      'focus:outline-none',
                      'transition-colors duration-fast',
                      'disabled:bg-surface-elevated disabled:text-text-muted',
                    )}
                  />
                  <Button type="submit" variant="primary" size="md">
                    Subscribe
                  </Button>
                </div>
                {error ? (
                  <p id="newsletter-error" role="alert" className="mt-2 text-body-sm text-error">
                    {error}
                  </p>
                ) : (
                  <p className="mt-3 text-caption text-text-muted">
                    We respect your privacy and never share your data.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* ── Divider ──────────────────────────────────────────────────────── */}
        <div className="mt-12 border-t border-border-default" aria-hidden="true" />

        {/* ── Main columns ─────────────────────────────────────────────────── */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12">

          {/* Logo */}
          <div>
            <Link
              to="/"
              className={cn(
                'inline-block rounded-sm',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
              )}
              aria-label="Learnova — home"
            >
              {!logoError ? (
                <img
                  src={logoPrimaryUrl}
                  alt="Learnova"
                  height={32}
                  className="h-8 w-auto"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-text-primary text-title-sm leading-none">
                  Learnova
                </span>
              )}
            </Link>
          </div>

          {/* Nav columns */}
          {NAV_COLUMNS.map(({ label, links }) => (
            <nav key={label} aria-label={`${label} links`}>
              <p className="text-body-sm font-semibold text-text-primary mb-4">
                {label}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map(({ label: linkLabel, to }) => (
                  <li key={linkLabel}>
                    <Link
                      to={to}
                      className={cn(
                        'text-body-sm text-text-secondary',
                        'hover:text-text-primary',
                        'transition-colors duration-fast',
                        'rounded-sm focus-visible:outline focus-visible:outline-2',
                        'focus-visible:outline-offset-1 focus-visible:outline-salem',
                      )}
                    >
                      {linkLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ── Bottom row ───────────────────────────────────────────────────── */}
        <div className={cn(
          'mt-16 pt-8 border-t border-border-default',
          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
        )}>
          <p className="text-caption text-text-muted flex flex-wrap items-center gap-x-1 gap-y-1">
            <span suppressHydrationWarning>© {new Date().getFullYear()} Learnova. All rights reserved.</span>
            <span aria-hidden="true" className="mx-1">·</span>
            <Link
              to="/privacy"
              className="hover:text-text-primary transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem rounded-sm"
            >
              Privacy
            </Link>
            <span aria-hidden="true" className="mx-1">·</span>
            <Link
              to="/terms"
              className="hover:text-text-primary transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem rounded-sm"
            >
              Terms
            </Link>
            <span aria-hidden="true" className="mx-1">·</span>
            <Link
              to="/cookies"
              className="hover:text-text-primary transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem rounded-sm"
            >
              Cookies
            </Link>
          </p>

          <div className="flex items-center gap-4" aria-label="Social media links">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className={cn(
                  'text-text-muted hover:text-text-primary',
                  'transition-colors duration-fast',
                  'rounded-sm focus-visible:outline focus-visible:outline-2',
                  'focus-visible:outline-offset-2 focus-visible:outline-salem',
                )}
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

      </Container>
    </footer>
  );
}

// ── Inline icon SVGs ────────────────────────────────────────────────────────

function IconCheck() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className="flex-shrink-0 text-success mt-[1px]"
    >
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Inline social SVGs (18×18) ───────────────────────────────────────────────
// Lucide 1.x removed brand icons; these match the same 18px/stroke-2 style.

function IconX() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLinkedin() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="4" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        ry="5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="17.5"
        y1="6.5"
        x2="17.51"
        y2="6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconYoutube() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
