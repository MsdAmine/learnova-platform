import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  type CreateLiveSessionPayload,
  type InstructorLiveSessionResponse,
  cancelInstructorLiveSession,
  createInstructorLiveSession,
  getMyInstructorLiveSessions,
} from '../../../api/liveSessions';
import { getMyInstructorCourses, type InstructorCourseResponse } from '../../../api/instructorCourses';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Input, FormField } from '../../../components/ui/Input';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { cn } from '../../../lib/cn';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function statusBadgeVariant(status: InstructorLiveSessionResponse['status']): BadgeVariant {
  if (status === 'SCHEDULED') return 'salem';
  if (status === 'CANCELLED') return 'coral';
  return 'default';
}

function isHttpStatus(err: unknown, status: number): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    (err as { response?: { status?: number } }).response?.status === status
  );
}

// Local datetime-local string ("YYYY-MM-DDTHH:mm") -> ISO 8601 instant string.
function toIsoInstant(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function InstructorLiveSessionsLoadingSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
        <div>
          <Bone className="h-7 w-52 mb-2" />
          <Bone className="h-4 w-72" />
        </div>
        <Bone className="h-10 w-44 rounded-md" />
      </div>
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-surface border border-border-default rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <Bone className="h-4 w-48" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-3 w-72" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Create session form modal ───────────────────────────────────────────────

const INPUT_CLASS = cn(
  'w-full bg-surface text-text-primary text-body',
  'border border-border-default rounded-md',
  'py-3 px-4',
  'transition-colors duration-fast ease-out',
  'focus:outline-none focus:border-salem',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem',
  'appearance-none',
  'disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed',
);

interface CreateSessionModalProps {
  courses: InstructorCourseResponse[];
  onClose: () => void;
  onSuccess: (session: InstructorLiveSessionResponse) => void;
}

function CreateSessionModal({ courses, onClose, onSuccess }: CreateSessionModalProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const eligibleCourses = courses.filter(c => c.status !== 'ARCHIVED');

  const [courseId, setCourseId] = useState<number | ''>(eligibleCourses[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // showModal() gives native focus trapping and restores focus to the opener on close.
  // jsdom doesn't implement it, so tests fall back to plain `open`.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (typeof dialog?.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog?.setAttribute('open', '');
    }
    titleInputRef.current?.focus();
  }, []);

  function closeDialog() {
    const dialog = dialogRef.current;
    if (typeof dialog?.close === 'function') {
      dialog.close();
    } else {
      onClose();
    }
  }

  function validate(): boolean {
    const next: Partial<Record<string, string>> = {};
    if (!courseId) {
      next.courseId = 'Course is required.';
    }
    if (!title.trim()) {
      next.title = 'Title is required.';
    } else if (title.length > 200) {
      next.title = 'Title must not exceed 200 characters.';
    }
    if (description.length > 2000) {
      next.description = 'Description must not exceed 2000 characters.';
    }
    if (!startTime) {
      next.startTime = 'Start time is required.';
    }
    if (!endTime) {
      next.endTime = 'End time is required.';
    }
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      next.endTime = 'End time must be after start time.';
    }
    if (maxParticipants && (!Number.isInteger(Number(maxParticipants)) || Number(maxParticipants) < 1)) {
      next.maxParticipants = 'Maximum participants must be a whole number of at least 1.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || courseId === '') return;
    setFormError(null);
    setSubmitting(true);
    try {
      const payload: CreateLiveSessionPayload = {
        title: title.trim(),
        startTime: toIsoInstant(startTime),
        endTime: toIsoInstant(endTime),
      };
      if (description) payload.description = description;
      if (maxParticipants) payload.maxParticipants = Number(maxParticipants);

      const result = await createInstructorLiveSession(courseId, payload);
      onSuccess(result);
      onClose();
    } catch (err) {
      setFormError(
        isHttpStatus(err, 409)
          ? 'Archived courses cannot have live sessions scheduled.'
          : 'We could not schedule this session. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={e => { if (submitting) e.preventDefault(); }}
      onClose={onClose}
      className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none flex items-center justify-center border-0 bg-transparent p-4"
      aria-labelledby="live-session-form-title"
    >
      <div
        className="absolute inset-0 bg-text-primary/40"
        aria-hidden="true"
        onClick={() => { if (!submitting) closeDialog(); }}
      />

      <div className="relative bg-surface rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-modal">
        <div className="px-6 pt-6 pb-4 border-b border-border-default">
          <h2 id="live-session-form-title" className="text-title-sm font-semibold text-text-primary">
            Schedule live session
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            Learners enrolled in the selected course will see this session.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-4 flex flex-col gap-4">

            {eligibleCourses.length === 0 ? (
              <p className="text-body-sm text-text-secondary" role="alert">
                You have no eligible courses. Create or unarchive a course first.
              </p>
            ) : (
              <div className="flex flex-col gap-xs">
                <label htmlFor="ls-course" className="text-body-sm font-medium text-text-secondary">
                  Course <span aria-hidden="true">*</span>
                </label>
                <select
                  id="ls-course"
                  value={courseId}
                  onChange={e => setCourseId(e.target.value ? Number(e.target.value) : '')}
                  disabled={submitting}
                  aria-invalid={!!fieldErrors.courseId || undefined}
                  aria-required="true"
                  className={cn(INPUT_CLASS, 'cursor-pointer', fieldErrors.courseId && 'border-error')}
                >
                  <option value="">Select a course</option>
                  {eligibleCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                {fieldErrors.courseId && (
                  <p className="text-body-sm text-error" role="alert">{fieldErrors.courseId}</p>
                )}
              </div>
            )}

            <FormField label="Title" htmlFor="ls-title" error={fieldErrors.title}>
              <Input
                id="ls-title"
                ref={titleInputRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={210}
                placeholder="e.g. Week 3 Q&A"
                hasError={!!fieldErrors.title}
                disabled={submitting}
              />
            </FormField>

            <FormField
              label="Description (optional)"
              htmlFor="ls-desc"
              error={fieldErrors.description}
            >
              <textarea
                id="ls-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2100}
                rows={3}
                placeholder="What will this session cover?"
                disabled={submitting}
                aria-invalid={!!fieldErrors.description || undefined}
                className={cn(
                  'w-full bg-surface text-text-primary text-body',
                  'border border-border-default rounded-md',
                  'py-3 px-4 resize-y',
                  'placeholder:text-text-muted',
                  'transition-colors duration-fast ease-out',
                  'focus:outline-none',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
                  fieldErrors.description
                    ? 'border-error focus:border-error focus-visible:outline-error'
                    : 'focus:border-salem focus-visible:outline-salem',
                  submitting && 'bg-surface-elevated text-text-muted cursor-not-allowed',
                )}
              />
            </FormField>

            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField label="Starts" htmlFor="ls-start" error={fieldErrors.startTime} className="flex-1">
                <Input
                  id="ls-start"
                  type="datetime-local"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  hasError={!!fieldErrors.startTime}
                  disabled={submitting}
                />
              </FormField>
              <FormField label="Ends" htmlFor="ls-end" error={fieldErrors.endTime} className="flex-1">
                <Input
                  id="ls-end"
                  type="datetime-local"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  hasError={!!fieldErrors.endTime}
                  disabled={submitting}
                />
              </FormField>
            </div>

            <FormField
              label="Maximum participants (optional)"
              htmlFor="ls-max"
              error={fieldErrors.maxParticipants}
            >
              <Input
                id="ls-max"
                type="number"
                min={1}
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                hasError={!!fieldErrors.maxParticipants}
                disabled={submitting}
              />
            </FormField>

            {formError && (
              <p className="text-body-sm text-error" role="alert">{formError}</p>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" size="md" onClick={closeDialog} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={submitting}
              disabled={eligibleCourses.length === 0}
            >
              Schedule session
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  );
}

// ── Session row ──────────────────────────────────────────────────────────────

interface SessionRowProps {
  session: InstructorLiveSessionResponse;
  onCancel: (id: number) => Promise<void>;
}

function SessionRow({ session, onCancel }: SessionRowProps) {
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setConfirming(false);
    setRowError(null);
    try {
      await onCancel(session.id);
    } catch {
      setRowError('Could not cancel this session. Try again.');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <article className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-1">
        <span className="text-body-sm font-semibold text-text-primary line-clamp-1 flex-1 min-w-0">
          {session.title}
        </span>
        <Badge variant={statusBadgeVariant(session.status)}>{session.status}</Badge>
      </div>

      <p className="text-caption text-text-muted mb-3">
        {session.courseTitle} · {formatDateTime(session.startTime)} – {formatDateTime(session.endTime)}
      </p>

      <div aria-live="polite" aria-atomic="true">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={session.meetingUrl} target="_blank" rel="noreferrer">
              Open meeting link
            </a>
          </Button>

          {session.status === 'SCHEDULED' && (
            confirming ? (
              <>
                <span className="text-caption text-text-secondary select-none">Cancel this session?</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={cancelling}>
                  Keep it
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={cancelling}
                  onClick={handleCancel}
                  aria-label={`Confirm cancel ${session.title}`}
                >
                  Cancel session
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setConfirming(true); setRowError(null); }}
                aria-label={`Cancel ${session.title}`}
              >
                Cancel session
              </Button>
            )
          )}
        </div>

        {rowError && (
          <p className="text-caption text-error mt-2 text-right" role="alert">{rowError}</p>
        )}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InstructorLiveSessionsPage() {
  const [sessions, setSessions] = useState<InstructorLiveSessionResponse[]>([]);
  const [courses, setCourses] = useState<InstructorCourseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [loadTick, setLoadTick] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getMyInstructorLiveSessions(), getMyInstructorCourses()])
      .then(([sessionData, courseData]) => {
        if (!cancelled) {
          setSessions(sessionData);
          setCourses(courseData);
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

  function upsertSession(session: InstructorLiveSessionResponse) {
    setSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) return prev.map(s => s.id === session.id ? session : s);
      return [session, ...prev];
    });
  }

  async function handleCancel(sessionId: number): Promise<void> {
    const updated = await cancelInstructorLiveSession(sessionId);
    upsertSession(updated);
  }

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {loading ? (
        <InstructorLiveSessionsLoadingSkeleton />
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-title font-semibold text-text-primary">Live sessions</h1>
              <p className="text-body-sm text-text-secondary mt-1">
                Schedule and manage live sessions for the courses you teach.
              </p>
            </div>
            {!fetchError && (
              <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>
                Schedule live session
              </Button>
            )}
          </div>

          {fetchError ? (
            <StatePanel
              message="We could not load your live sessions."
              onRetry={handleRetry}
            />
          ) : sessions.length === 0 ? (
            <div className="bg-surface border border-accent-border rounded-lg px-6 py-12 text-center">
              <p className="text-body-sm font-medium text-text-primary mb-1">
                No live sessions scheduled
              </p>
              <p className="text-body-sm text-text-secondary mb-4">
                Schedule a session so enrolled learners can join you live.
              </p>
              <Button variant="primary" size="md" onClick={() => setFormOpen(true)}>
                Schedule live session
              </Button>
            </div>
          ) : (
            <ul className="flex flex-col gap-3" aria-label="Live sessions">
              {sessions.map(session => (
                <li key={session.id}>
                  <SessionRow session={session} onCancel={handleCancel} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {formOpen && (
        <CreateSessionModal
          courses={courses}
          onClose={() => setFormOpen(false)}
          onSuccess={upsertSession}
        />
      )}
    </div>
  );
}
