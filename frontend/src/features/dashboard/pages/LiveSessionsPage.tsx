import { useState } from 'react';
import { Video } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { FilterTabs } from '../../../components/ui/FilterTabs';

// ── Types ──────────────────────────────────────────────────────────────────────

type LiveSessionStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';
type LiveSessionFilter = 'all' | 'live' | 'upcoming' | 'past';

interface LiveSessionItem {
  id: string;
  title: string;
  courseTitle: string;
  instructor: string;
  startsAt: string;           // ISO 8601
  endsAt: string;             // ISO 8601
  status: LiveSessionStatus;
  meetingUrl?: string;        // present when status === 'live' and integration enabled
  recordingUrl?: string;      // present when status === 'completed' and recording exists
  attendanceStatus?: 'registered' | 'attended' | 'missed';
}

// ── Mock data ──────────────────────────────────────────────────────────────────
// UI-state model only. Not a backend contract. Replace with real API calls when
// the live sessions endpoint is available.

const SESSIONS: LiveSessionItem[] = [
  {
    id: '1',
    title: 'Advanced React Q&A',
    courseTitle: 'Advanced React Patterns and Architecture',
    instructor: 'Sarah Chen',
    startsAt: '2026-06-11T14:00:00',
    endsAt:   '2026-06-11T15:00:00',
    status: 'live',
    meetingUrl: 'https://meet.learnova.app/sessions/react-qa-jun11',
  },
  {
    id: '6',
    title: 'Node.js Performance Workshop',
    courseTitle: 'Node.js Backend Engineering',
    instructor: 'James Okafor',
    startsAt: '2026-06-11T13:30:00',
    endsAt:   '2026-06-11T14:30:00',
    status: 'live',
  },
  {
    id: '2',
    title: 'TypeScript Deep Dive Q&A',
    courseTitle: 'TypeScript for Production Systems',
    instructor: 'Marcus Webb',
    startsAt: '2026-06-12T14:00:00',
    endsAt:   '2026-06-12T15:30:00',
    status: 'scheduled',
    attendanceStatus: 'registered',
  },
  {
    id: '3',
    title: 'System Design Open Session',
    courseTitle: 'System Design Fundamentals',
    instructor: 'Priya Mehta',
    startsAt: '2026-06-15T10:00:00',
    endsAt:   '2026-06-15T11:00:00',
    status: 'scheduled',
  },
  {
    id: '4',
    title: 'Intro to TypeScript Types',
    courseTitle: 'TypeScript for Production Systems',
    instructor: 'Marcus Webb',
    startsAt: '2026-06-03T10:00:00',
    endsAt:   '2026-06-03T11:00:00',
    status: 'completed',
    recordingUrl: 'https://recordings.learnova.app/sessions/ts-types-jun03',
    attendanceStatus: 'attended',
  },
  {
    id: '5',
    title: 'Node.js Architecture Review',
    courseTitle: 'Node.js Backend Engineering',
    instructor: 'James Okafor',
    startsAt: '2026-06-01T09:00:00',
    endsAt:   '2026-06-01T10:00:00',
    status: 'cancelled',
  },
];

// ── Date/time helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatDayOfWeek(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── SessionStatusBadge ─────────────────────────────────────────────────────────

function SessionStatusBadge({ status }: { status: LiveSessionStatus }) {
  switch (status) {
    case 'live':      return <Badge variant="salem">Live now</Badge>;
    case 'scheduled': return <Badge variant="default">Upcoming</Badge>;
    case 'completed': return <Badge variant="default">Completed</Badge>;
    case 'cancelled': return <Badge variant="coral">Cancelled</Badge>;
  }
}

// ── LiveSessionSummary ─────────────────────────────────────────────────────────

function LiveSessionSummary({ sessions }: { sessions: LiveSessionItem[] }) {
  const liveCount      = sessions.filter(s => s.status === 'live').length;
  const upcomingCount  = sessions.filter(s => s.status === 'scheduled').length;
  const recordingCount = sessions.filter(s => s.status === 'completed' && s.recordingUrl).length;

  return (
    <div
      className="flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary"
      aria-label="Session statistics"
    >
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{liveCount}</span>
        live now
      </span>
      <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{upcomingCount}</span>
        upcoming
      </span>
      <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
      <span className="flex items-center">
        <span className="font-semibold text-text-primary mr-1.5">{recordingCount}</span>
        {recordingCount === 1 ? 'recording' : 'recordings'} available
      </span>
    </div>
  );
}

// ── FeaturedSessionRow ─────────────────────────────────────────────────────────
// Shows the single most urgent session: live first, then nearest scheduled.
// Rendered only on the 'all' filter.

function FeaturedSessionRow({ session }: { session: LiveSessionItem }) {
  const eyebrow   = session.status === 'live' ? 'Live now' : 'Next session';
  const startTime = formatTime(session.startsAt);
  const endTime   = formatTime(session.endsAt);

  const timeDisplay =
    session.status === 'live'
      ? `Started ${startTime} · ends ${endTime}, ${formatDateLong(session.startsAt)}`
      : `${formatDateLong(session.startsAt)}, ${startTime} - ${endTime}`;

  return (
    <div className="flex bg-surface border border-border-hover rounded-lg overflow-hidden mb-6">
      {/* Left tonal icon block — decorative */}
      <div
        className="hidden sm:flex w-20 items-center justify-center flex-shrink-0 self-stretch bg-surface-elevated"
        aria-hidden="true"
      >
        <Video size={20} className="text-text-muted" aria-hidden="true" />
      </div>

      {/* Content block */}
      <div className="flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <span className="text-caption text-text-muted">{eyebrow}</span>
          <span className="flex-shrink-0">
            <SessionStatusBadge status={session.status} />
          </span>
        </div>

        <p className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
          {session.title}
        </p>
        <p className="text-caption text-text-secondary mb-0.5">
          {session.courseTitle} · {session.instructor}
        </p>
        <time className="text-caption text-text-secondary block mb-3" dateTime={session.startsAt}>
          {timeDisplay}
        </time>

        {/* Action row — only for live sessions; scheduled sessions have no action in v1 */}
        {session.status === 'live' && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {session.meetingUrl ? (
              // Primary action: sole Button variant="primary" on the page (Forest Rule)
              <Button variant="primary" size="sm" asChild>
                <a
                  href={session.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Join live session: ${session.title}`}
                >
                  Join session
                </a>
              </Button>
            ) : (
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  aria-label={`Join live session: ${session.title}`}
                >
                  Join session
                </Button>
                <p className="text-caption text-text-muted mt-1">
                  Meeting link not available yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LiveSessionRow ─────────────────────────────────────────────────────────────
// Shared row anatomy for both upcoming and past sections.
// Right block varies by session.status.

function LiveSessionRow({ session }: { session: LiveSessionItem }) {
  const dateStr   = formatDate(session.startsAt);
  const dayStr    = formatDayOfWeek(session.startsAt);
  const startTime = formatTime(session.startsAt);
  const endTime   = formatTime(session.endsAt);

  return (
    <li className="px-5 py-4">
      {/* Mobile (<sm): right block wraps to a full-width line below the content,
          indented to the content column (time block w-14 + gap-4 = 72px). */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5 sm:flex-nowrap">

        {/* Left: date/time block */}
        <div className="w-14 flex-shrink-0 flex flex-col gap-0.5 pt-0.5">
          <time
            dateTime={session.startsAt}
            className="text-caption font-semibold text-text-primary"
          >
            {dateStr}
          </time>
          <span className="text-caption text-text-muted">{dayStr}</span>
          <span className="text-caption text-text-secondary">{startTime}</span>
        </div>

        {/* Center: title, course, instructor, time range */}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
            {session.title}
          </p>
          <p className="text-caption text-text-secondary">
            {session.courseTitle} · {session.instructor}
          </p>
          <p className="text-caption text-text-muted">
            {startTime} - {endTime}
          </p>
          {session.status === 'cancelled' && (
            <p className="text-caption text-text-muted mt-0.5">
              This session was cancelled.
            </p>
          )}
          {session.attendanceStatus === 'attended' && (
            <p className="text-caption text-text-muted mt-1">
              You attended this session.
            </p>
          )}
          {session.attendanceStatus === 'missed' && session.status === 'completed' && (
            <p className="text-caption text-text-muted mt-1">
              You missed this session.
            </p>
          )}
        </div>

        {/* Right: badge + optional action */}
        <div className="w-full pl-[72px] flex items-center gap-2 sm:w-auto sm:pl-0 sm:flex-shrink-0">
          <SessionStatusBadge status={session.status} />

          {session.status === 'live' && session.meetingUrl && (
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Join live session: ${session.title}`}
              className="text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 flex items-center hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              Join
            </a>
          )}

          {session.status === 'completed' && session.recordingUrl && (
            <a
              href={session.recordingUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Watch recording: ${session.title}`}
              className="text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 flex items-center hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              Watch recording
            </a>
          )}
        </div>

      </div>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LiveSessionsPage() {
  const [filter, setFilter] = useState<LiveSessionFilter>('all');

  // Derived session groups
  const liveSessions = SESSIONS.filter(s => s.status === 'live');

  const scheduledSessions = SESSIONS
    .filter(s => s.status === 'scheduled')
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt)); // ascending: nearest first

  const pastSessions = SESSIONS
    .filter(s => s.status === 'completed' || s.status === 'cancelled')
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt)); // descending: most recent first

  // Featured session: live first, then nearest scheduled.
  // Exclusive to the 'all' filter; other filters render flat lists.
  const featuredSession: LiveSessionItem | null =
    filter === 'all' ? liveSessions[0] ?? scheduledSessions[0] ?? null : null;

  // Upcoming list: all scheduled sessions, minus the featured one when it's scheduled
  const upcomingListSessions: LiveSessionItem[] = (() => {
    if (filter === 'all') {
      return scheduledSessions.filter(s => s.id !== featuredSession?.id);
    }
    if (filter === 'upcoming') return scheduledSessions;
    return [];
  })();

  // Past list
  const pastListSessions: LiveSessionItem[] =
    filter === 'all' || filter === 'past' ? pastSessions : [];

  // Additional live sessions beyond the featured one, shown on 'all' and 'live' filters.
  // The featured live session is excluded to prevent duplication.
  const liveListSessions: LiveSessionItem[] = (() => {
    if (filter === 'all' || filter === 'live') {
      return featuredSession
        ? liveSessions.filter(s => s.id !== featuredSession.id)
        : liveSessions;
    }
    return [];
  })();

  // Toolbar count
  const toolbarCount = (() => {
    switch (filter) {
      case 'live':     return liveSessions.length;
      case 'upcoming': return scheduledSessions.length;
      case 'past':     return pastSessions.length;
      default:         return SESSIONS.length;
    }
  })();

  // Empty states
  const hasNoData   = SESSIONS.length === 0;
  const filterEmpty =
    (filter === 'live'     && liveSessions.length === 0)     ||
    (filter === 'upcoming' && scheduledSessions.length === 0) ||
    (filter === 'past'     && pastSessions.length === 0);

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Live Sessions</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Join upcoming instructor-led sessions and review your schedule.
        </p>
      </div>

      {/* 2. Summary strip ───────────────────────────────────────────────── */}
      <LiveSessionSummary sessions={SESSIONS} />

      {/* 3. Filter toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
        <span className="text-body-sm text-text-secondary">
          {toolbarCount}{' '}
          {toolbarCount === 1 ? 'session' : 'sessions'}
        </span>
        <FilterTabs
          options={[
            { value: 'all',      label: 'All'      },
            { value: 'live',     label: 'Live'     },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past',     label: 'Past'     },
          ]}
          value={filter}
          onChange={setFilter}
          aria-label="Filter sessions"
        />
      </div>

      {/* ── Empty state: no sessions at all ─────────────────────────────── */}
      {hasNoData ? (
        <div className="bg-surface border border-border-default rounded-lg p-8 flex flex-col items-center text-center gap-3">
          <Video size={28} className="text-text-muted" aria-hidden="true" />
          <span className="text-body-sm font-semibold text-text-primary">
            No live sessions scheduled
          </span>
          <p className="text-body-sm text-text-secondary">
            Upcoming instructor-led sessions will appear here when they are available.
          </p>
        </div>

      ) : filterEmpty ? (
        /* ── Empty state: filter matches nothing ──────────────────────── */
        <p className="text-body-sm text-text-muted py-10 text-center">
          No sessions match this filter.
        </p>

      ) : (
        <>
          {/* 4. Featured session row — 'all' and 'live' filters ──────────── */}
          {featuredSession && (
            <FeaturedSessionRow session={featuredSession} />
          )}

          {/* 5. Live now section — additional live sessions beyond featured ── */}
          {liveListSessions.length > 0 && (
            <section className="mb-6" aria-label="Live sessions">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                Live now ({liveListSessions.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {liveListSessions.map(session => (
                  <LiveSessionRow key={session.id} session={session} />
                ))}
              </ul>
            </section>
          )}

          {/* 6. Upcoming sessions section ───────────────────────────────── */}
          {upcomingListSessions.length > 0 && (
            <section className="mb-6" aria-label="Upcoming sessions">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                Upcoming ({upcomingListSessions.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {upcomingListSessions.map(session => (
                  <LiveSessionRow key={session.id} session={session} />
                ))}
              </ul>
            </section>
          )}

          {/* 7. Past sessions section ───────────────────────────────────── */}
          {pastListSessions.length > 0 && (
            <section className="mb-6" aria-label="Past sessions">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                Past sessions ({pastListSessions.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {pastListSessions.map(session => (
                  <LiveSessionRow key={session.id} session={session} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

    </div>
  );
}
