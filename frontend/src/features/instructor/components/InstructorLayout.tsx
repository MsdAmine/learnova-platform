import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../lib/cn';
import logoPrimary from '../../../assets/logo-primary.png';

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export default function InstructorLayout() {
  const { user, setActiveProfile } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.fullName ?? 'User';
  const initials = user?.fullName ? getInitials(user.fullName) : '?';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base">

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-text-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-salem"
      >
        Skip to content
      </a>

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="h-nav-mobile md:h-nav bg-surface border-b border-border-default flex items-center px-4 md:px-6 flex-shrink-0 z-50">

        {/* Left: back link + logo + teaching label */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => {
              setActiveProfile('LEARNER');
              navigate('/dashboard');
            }}
            className={cn(
              'flex items-center gap-1.5 text-body-sm text-text-secondary flex-shrink-0',
              'hover:text-text-primary transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
            )}
            aria-label="Back to learner dashboard"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <span className="text-border-default select-none flex-shrink-0" aria-hidden="true">/</span>

          <div className="flex items-center gap-2 min-w-0">
            <img src={logoPrimary} alt="Learnova" className="h-6 w-auto flex-shrink-0" width={754} height={294} />
            <span className="hidden md:inline text-caption text-text-muted font-medium border border-border-default rounded-full px-2 py-0.5 flex-shrink-0">
              Teaching
            </span>
          </div>
        </div>

        {/* Right: notifications + user chip */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            aria-label="Notifications"
            className={cn(
              'w-11 h-11 flex items-center justify-center rounded-md',
              'text-text-muted hover:bg-surface-elevated hover:text-text-secondary',
              'transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
            )}
          >
            <Bell size={17} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2.5 pl-1">
            <div
              className="w-8 h-8 rounded-full bg-salem-50 text-salem flex items-center justify-center text-caption font-semibold leading-none select-none"
              aria-hidden="true"
            >
              {initials}
            </div>
            <span className="hidden sm:inline text-body-sm text-text-secondary">
              <span className="font-medium text-text-primary">{displayName}</span>
              {' / '}Instructor
            </span>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
        <Outlet />
      </main>

    </div>
  );
}
