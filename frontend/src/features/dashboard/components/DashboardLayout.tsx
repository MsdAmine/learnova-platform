import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  TrendingUp,
  Award,
  Video,
  Settings,
  Bell,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { cn } from '../../../lib/cn';
import logoPrimary from '../../../assets/logo-primary.png';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard',                end: true  },
  { icon: BookOpen,        label: 'My Courses',     path: '/dashboard/courses',        end: false },
  { icon: TrendingUp,      label: 'Progress',       path: '/dashboard/progress',       end: false },
  { icon: Award,           label: 'Certificates',   path: '/dashboard/certificates',   end: false },
  { icon: Video,           label: 'Live Sessions',  path: '/dashboard/live-sessions',  end: false },
  { icon: Settings,        label: 'Settings',       path: '/dashboard/settings',       end: false },
] as const;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export default function DashboardLayout() {
  const { user, activeProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName  = user?.fullName ?? 'User';
  const initials     = user?.fullName ? getInitials(user.fullName) : '?';
  const profileLabel = activeProfile === 'INSTRUCTOR' ? 'Instructor' : 'Learner';

  const showInstructorCta = user?.instructorApprovalStatus === null;
  const showPendingNote   = user?.instructorApprovalStatus === 'PENDING';
  const showSidebarCta    = showInstructorCta || showPendingNote;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg-base">

      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-text-primary focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-salem">Skip to content</a>

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <header className="h-[60px] bg-surface border-b border-border-default flex items-center px-4 md:px-6 flex-shrink-0 z-50">

        {/* Mobile hamburger — hidden on md+ */}
        <button
          type="button"
          aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
          onClick={() => setSidebarOpen(v => !v)}
          className={cn(
            'md:hidden mr-1 w-11 h-11 flex items-center justify-center rounded-md flex-shrink-0',
            'text-text-muted hover:bg-surface-elevated hover:text-text-secondary',
            'transition-colors duration-fast',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
          )}
        >
          {sidebarOpen
            ? <X size={17} aria-hidden="true" />
            : <Menu size={17} aria-hidden="true" />
          }
        </button>

        <div className="w-auto md:w-[250px] flex items-center md:pr-6 flex-shrink-0">
          <img src={logoPrimary} alt="Learnova" className="h-7 w-auto" />
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
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
              aria-hidden="true"
              className="w-8 h-8 rounded-full bg-salem-50 text-salem flex items-center justify-center text-caption font-semibold leading-none select-none"
            >
              {initials}
            </div>
            <span className="hidden sm:inline text-body-sm text-text-secondary">
              <span className="font-medium text-text-primary">{displayName}</span>
              {' / '}{profileLabel}
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Overlay — closes drawer on tap, mobile only */}
        <div
          aria-hidden="true"
          onClick={closeSidebar}
          className={cn(
            'fixed top-[60px] inset-x-0 bottom-0 z-30 bg-black/20',
            'md:hidden',
            'transition-opacity duration-200',
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          )}
        />

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside
          id="dashboard-sidebar"
          className={cn(
            // Mobile: fixed drawer sliding from left, below topbar
            'fixed top-[60px] bottom-0 left-0 z-40 w-[250px]',
            // Desktop: static in flex flow, always visible
            'md:static md:top-auto md:bottom-auto md:z-auto',
            'bg-surface border-r border-border-default flex flex-col overflow-y-auto flex-shrink-0',
            // Slide transition (transform-only; no layout property animated)
            'transition-transform duration-200 ease-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          )}
          aria-label="Main navigation"
        >
          <nav className="flex flex-col gap-0.5 p-4 pt-5 flex-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md',
                    'text-body-sm font-medium transition-colors duration-fast',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
                    isActive
                      ? 'bg-salem text-white'
                      : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                  )
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Instructor CTA */}
          {showSidebarCta && (
            <div className="p-4 pt-2">
              <div className="border border-border-default rounded-lg p-3.5">
                {showInstructorCta ? (
                  <>
                    <div className="flex items-center gap-2 mb-1.5">
                      <GraduationCap size={14} className="text-salem flex-shrink-0" aria-hidden="true" />
                      <span className="text-body-sm font-medium text-text-primary">
                        Become an instructor
                      </span>
                    </div>
                    <p className="text-caption text-text-secondary mb-3 leading-relaxed">
                      Share your expertise and reach learners on Learnova.
                    </p>
                    <NavLink
                      to="/dashboard/settings"
                      onClick={closeSidebar}
                      className={cn(
                        'inline-flex items-center text-body-sm font-medium text-salem',
                        'hover:text-salem-400 transition-colors duration-fast',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
                      )}
                    >
                      Apply now
                    </NavLink>
                  </>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-warning flex-shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-body-sm text-text-secondary leading-snug">
                      Instructor application{' '}
                      <span className="font-medium text-text-primary">pending review</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ── Main content ─────────────────────────────────────────────── */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          tabIndex={-1}
        >
          <Outlet />
        </main>

      </div>
    </div>
  );
}
