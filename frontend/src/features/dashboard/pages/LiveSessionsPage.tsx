import { useEffect, useState } from 'react';
import { Video } from 'lucide-react';
import {
  type LearnerLiveSessionResponse,
  joinLiveSession,
  listUpcomingLiveSessions,
} from '../../../api/liveSessions';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';

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

// ── Loading skeleton ───────────────────────────────────────────────────────────

function LiveSessionsLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-7 w-44 mb-2" />
      <Bone className="h-4 w-72 mb-8" />
      <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
        {[0, 1, 2].map(i => (
          <li key={i} className="px-5 py-4 flex items-start gap-4">
            <Bone className="h-10 w-14 flex-shrink-0" />
            <div className="flex-1">
              <Bone className="h-4 w-56 mb-2" />
              <Bone className="h-3 w-40" />
            </div>
            <Bone className="h-9 w-20 rounded-md flex-shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── LiveSessionRow ─────────────────────────────────────────────────────────────

interface LiveSessionRowProps {
  session: LearnerLiveSessionResponse;
  joining: boolean;
  joinError: string | null;
  onJoin: (session: LearnerLiveSessionResponse) => void;
}

function LiveSessionRow({ session, joining, joinError, onJoin }: LiveSessionRowProps) {
  const dateStr   = formatDate(session.startTime);
  const dayStr    = formatDayOfWeek(session.startTime);
  const startTime = formatTime(session.startTime);
  const endTime   = formatTime(session.endTime);

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2 sm:flex-nowrap">

        {/* Left: date/time block */}
        <div className="w-14 flex-shrink-0 flex flex-col gap-0.5 pt-0.5">
          <time
            dateTime={session.startTime}
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
            {session.courseTitle} · {session.instructorName}
          </p>
          <p className="text-caption text-text-muted">
            {startTime} - {endTime}
          </p>
          {joinError && (
            <p className="text-caption text-error mt-1" role="alert">{joinError}</p>
          )}
        </div>

        {/* Right: join action */}
        <div className="w-full sm:w-auto flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            loading={joining}
            onClick={() => onJoin(session)}
            aria-label={`Join live session: ${session.title}`}
          >
            Join
          </Button>
        </div>

      </div>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LiveSessionsPage() {
  const [sessions, setSessions] = useState<LearnerLiveSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [loadTick, setLoadTick] = useState(0);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinErrors, setJoinErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    listUpcomingLiveSessions()
      .then(data => {
        if (!cancelled) {
          setSessions(data);
          setFetchError(false);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFetchError(true);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [loadTick]);

  function handleRetry() {
    setLoading(true);
    setFetchError(false);
    setLoadTick(t => t + 1);
  }

  async function handleJoin(session: LearnerLiveSessionResponse) {
    setJoiningId(session.id);
    setJoinErrors(prev => {
      const next = { ...prev };
      delete next[session.id];
      return next;
    });
    try {
      const result = await joinLiveSession(session.id);
      window.open(result.meetingUrl, '_blank', 'noopener,noreferrer');
    } catch {
      setJoinErrors(prev => ({
        ...prev,
        [session.id]: 'We could not join this session. Try again.',
      }));
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ─────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Live Sessions</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Join upcoming instructor-led sessions for the courses you are enrolled in.
        </p>
      </div>

      {loading ? (
        <LiveSessionsLoadingSkeleton />
      ) : fetchError ? (
        <StatePanel
          message="We could not load your live sessions."
          onRetry={handleRetry}
        />
      ) : sessions.length === 0 ? (
        <div className="bg-surface border border-border-default rounded-lg p-8 flex flex-col items-center text-center gap-3">
          <Video size={28} className="text-text-muted" aria-hidden="true" />
          <span className="text-body-sm font-semibold text-text-primary">
            No live sessions scheduled
          </span>
          <p className="text-body-sm text-text-secondary">
            Upcoming sessions for your enrolled courses will appear here when an instructor schedules one.
          </p>
        </div>
      ) : (
        <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
          {sessions.map(session => (
            <LiveSessionRow
              key={session.id}
              session={session}
              joining={joiningId === session.id}
              joinError={joinErrors[session.id] ?? null}
              onJoin={handleJoin}
            />
          ))}
        </ul>
      )}

    </div>
  );
}
