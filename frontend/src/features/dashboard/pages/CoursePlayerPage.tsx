import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import {
  getLearnerCourseContent,
  updateLessonProgress,
  type CourseContentResponse,
  type LessonContentResponse,
} from '../../../api/courseContent';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSeconds(s: number): string {
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

function formatTimeSpent(s: number): string {
  if (s < 60) return `${s}s spent`;
  return `${Math.floor(s / 60)}m spent`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ErrorKind = 'none' | 'notFound' | 'generic';

// ── Loading skeleton ──────────────────────────────────────────────────────────

function CoursePlayerSkeleton() {
  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto" aria-hidden="true">
      <Bone className="h-4 w-36 mb-4" />
      <div className="mb-8">
        <Bone className="h-7 w-2/3 mb-2" />
        <Bone className="h-4 w-48 mb-3" />
        <Bone className="h-1 w-full rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Bone className="h-80 rounded-lg" />
        <Bone className="h-80 rounded-lg" />
      </div>
    </div>
  );
}

// ── Lesson content panel ──────────────────────────────────────────────────────

function LessonPanel({
  lesson,
  saving,
  saveError,
  onMarkComplete,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  prevTitle,
  nextTitle,
}: {
  lesson: LessonContentResponse;
  saving: boolean;
  saveError: boolean;
  onMarkComplete: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  prevTitle: string | null;
  nextTitle: string | null;
}) {
  const showTimeDetail =
    lesson.lastPositionSeconds != null || lesson.timeSpentSeconds != null;

  return (
    <section className="bg-surface border border-border-default rounded-lg p-4">
      <h2 className="text-title-sm font-semibold text-text-primary mb-2">
        {lesson.title}
      </h2>

      {lesson.completed ? (
        <div className="mb-3">
          <Badge variant="anzac" className="gap-1">
            <Check size={10} aria-hidden="true" />
            Done
          </Badge>
        </div>
      ) : (
        <p className="text-caption text-text-muted mb-3">Not completed yet</p>
      )}

      {showTimeDetail && (
        <p className="text-caption text-text-secondary mb-3">
          {lesson.lastPositionSeconds != null && (
            <span>Resumed at {formatSeconds(lesson.lastPositionSeconds)}</span>
          )}
          {lesson.lastPositionSeconds != null && lesson.timeSpentSeconds != null && (
            <span aria-hidden="true"> · </span>
          )}
          {lesson.timeSpentSeconds != null && (
            <span>{formatTimeSpent(lesson.timeSpentSeconds)}</span>
          )}
        </p>
      )}

      <div className="bg-surface-elevated rounded-md p-6 text-center mb-4">
        <p className="text-body-sm text-text-secondary">
          Lesson content will appear here when lesson materials are available.
        </p>
      </div>

      {saveError && (
        <p
          className="text-body-sm text-error mb-3"
          role="alert"
          aria-live="polite"
        >
          Could not update progress. Try again.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
        <div>
          {!lesson.completed && (
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={saving}
              onClick={onMarkComplete}
            >
              Mark as complete
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasPrev}
            aria-disabled={!hasPrev}
            aria-label={prevTitle ? `Previous lesson: ${prevTitle}` : 'Previous lesson'}
            onClick={onPrev}
            className="gap-1"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            Prev
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasNext}
            aria-disabled={!hasNext}
            aria-label={nextTitle ? `Next lesson: ${nextTitle}` : 'Next lesson'}
            onClick={onNext}
            className="gap-1"
          >
            Next
            <ArrowRight size={13} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ── Course outline ────────────────────────────────────────────────────────────

function CourseOutline({
  content,
  selectedLessonId,
  onSelectLesson,
}: {
  content: CourseContentResponse;
  selectedLessonId: number | null;
  onSelectLesson: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4" aria-label="Course outline">
      {content.sections.map(section => (
        <div
          key={section.id}
          className="bg-surface border border-border-default rounded-lg p-4"
        >
          <h3 className="text-title-sm font-semibold text-text-primary mb-2">
            {section.title}
          </h3>
          {section.lessons.length === 0 ? (
            <p className="text-caption text-text-muted">
              No lessons in this section yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {section.lessons.map(lesson => {
                const isSelected = lesson.id === selectedLessonId;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      aria-current={isSelected ? 'true' : undefined}
                      aria-label={`${lesson.title}${lesson.completed ? ', completed' : ''}`}
                      onClick={() => onSelectLesson(lesson.id)}
                      className={cn(
                        'w-full flex items-center gap-2 text-left rounded-md px-2 py-2 min-h-[44px]',
                        'text-body-sm motion-safe:transition-colors duration-fast',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
                        isSelected
                          ? 'bg-salem-50 text-salem font-medium'
                          : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                      )}
                    >
                      {lesson.completed ? (
                        <Check
                          size={14}
                          className="flex-shrink-0 text-salem"
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className="flex-shrink-0 w-3.5 h-3.5 rounded-full border border-current opacity-40"
                          aria-hidden="true"
                        />
                      )}
                      <span className="line-clamp-2">{lesson.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Back link (shared between states) ────────────────────────────────────────

const backLinkClass = cn(
  'inline-flex items-center gap-1 mb-4',
  'text-body-sm font-medium text-text-secondary',
  'hover:text-text-primary motion-safe:transition-colors duration-fast',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
);

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CoursePlayerPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const courseId = Number(courseIdParam);

  const [content, setContent] = useState<CourseContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorKind>('none');
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [savingLessonId, setSavingLessonId] = useState<number | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const detailsRef = useRef<HTMLDetailsElement>(null);

  // State resets happen in event handlers (handleRetry), not here, to satisfy
  // the react-hooks/set-state-in-effect rule. Initial loading=true is the
  // correct starting value; on retry, the handler resets it before incrementing
  // retryCount, ensuring the effect always runs with loading already true.
  useEffect(() => {
    const token = { cancelled: false };
    getLearnerCourseContent(courseId)
      .then(data => {
        if (token.cancelled) return;
        setContent(data);
        setError('none');
        const flat = data.sections.flatMap(s => s.lessons);
        const firstIncomplete = flat.find(l => !l.completed);
        setSelectedLessonId(firstIncomplete?.id ?? flat[0]?.id ?? null);
      })
      .catch((err: unknown) => {
        if (token.cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        setError(status === 404 ? 'notFound' : 'generic');
      })
      .finally(() => {
        if (!token.cancelled) setLoading(false);
      });
    return () => {
      token.cancelled = true;
    };
  }, [courseId, retryCount]);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const flatLessons = useMemo(
    () => content?.sections.flatMap(s => s.lessons) ?? [],
    [content],
  );

  const totalLessons = flatLessons.length;
  const completedLessons = flatLessons.filter(l => l.completed).length;
  const progressPercentage =
    totalLessons === 0
      ? 0
      : Math.round((completedLessons / totalLessons) * 100);

  const selectedLesson = useMemo(
    () => flatLessons.find(l => l.id === selectedLessonId) ?? null,
    [flatLessons, selectedLessonId],
  );

  const selectedIndex = useMemo(
    () => flatLessons.findIndex(l => l.id === selectedLessonId),
    [flatLessons, selectedLessonId],
  );

  const prevLesson =
    selectedIndex > 0 ? flatLessons[selectedIndex - 1] : null;
  const nextLesson =
    selectedIndex >= 0 && selectedIndex < flatLessons.length - 1
      ? flatLessons[selectedIndex + 1]
      : null;

  // ── Actions ──────────────────────────────────────────────────────────────────

  function handleSelectLesson(id: number) {
    setSelectedLessonId(id);
    setSaveError(false);
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }

  function handleMarkComplete() {
    if (!selectedLesson || selectedLesson.completed || !content) return;
    const snapshot = content;

    setSavingLessonId(selectedLesson.id);
    setSaveError(false);

    const optimistic: CourseContentResponse = {
      ...content,
      sections: content.sections.map(section => ({
        ...section,
        lessons: section.lessons.map(l =>
          l.id === selectedLesson.id ? { ...l, completed: true } : l,
        ),
      })),
    };
    setContent(optimistic);

    updateLessonProgress(selectedLesson.id, { isCompleted: true })
      .catch(() => {
        setContent(snapshot);
        setSaveError(true);
      })
      .finally(() => {
        setSavingLessonId(null);
      });
  }

  // ── Render states ─────────────────────────────────────────────────────────

  if (loading) return <CoursePlayerSkeleton />;

  if (error === 'notFound') {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <StatePanel
          title="Course content is unavailable."
          message="This course may not exist, or you may not be enrolled."
        />
        <div className="mt-4 text-center">
          <Link to="/dashboard/courses" className={backLinkClass}>
            <ArrowLeft size={13} aria-hidden="true" />
            Back to My Courses
          </Link>
        </div>
      </div>
    );
  }

  function handleRetry() {
    setLoading(true);
    setError('none');
    setRetryCount(c => c + 1);
  }

  if (error === 'generic') {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <StatePanel
          message="We could not load this course."
          onRetry={handleRetry}
        />
      </div>
    );
  }

  if (!content) return null;

  const hasLessons = flatLessons.length > 0;

  if (!hasLessons) {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <Link to="/dashboard/courses" className={backLinkClass}>
          <ArrowLeft size={13} aria-hidden="true" />
          Back to My Courses
        </Link>
        <h1 className="text-title font-semibold text-text-primary mb-8">
          {content.courseTitle}
        </h1>
        <StatePanel
          title="No lessons available yet"
          message="This course does not have published lessons yet."
        />
      </div>
    );
  }

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Back link */}
      <Link to="/dashboard/courses" className={backLinkClass}>
        <ArrowLeft size={13} aria-hidden="true" />
        Back to My Courses
      </Link>

      {/* Course header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">
          {content.courseTitle}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Continue learning where you left off.
        </p>
        <div className="mt-3">
          <p className="text-body-sm text-text-secondary mb-1.5">
            <span className="font-semibold text-text-primary">
              {completedLessons}
            </span>
            {' of '}
            <span className="font-semibold text-text-primary">
              {totalLessons}
            </span>
            {' lessons complete · '}
            <span className="font-semibold text-text-primary">
              {progressPercentage}%
            </span>
          </p>
          <ProgressBar value={progressPercentage} label="Course progress" />
        </div>
      </div>

      {/* Player grid */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* Mobile: collapsible outline, collapsed by default, hidden on lg */}
        <details
          ref={detailsRef}
          className="group lg:hidden bg-surface border border-border-default rounded-lg"
        >
          <summary className={cn(
            'flex items-center justify-between px-4 py-3 cursor-pointer list-none rounded-lg',
            'text-body-sm font-medium text-text-primary',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
            '[&::-webkit-details-marker]:hidden',
          )}>
            <span>Lessons · {completedLessons} of {totalLessons} complete</span>
            <ChevronDown
              size={15}
              aria-hidden="true"
              className="text-text-muted motion-safe:transition-transform duration-fast group-open:rotate-180"
            />
          </summary>
          <div className="px-4 pb-4">
            <CourseOutline
              content={content}
              selectedLessonId={selectedLessonId}
              onSelectLesson={handleSelectLesson}
            />
          </div>
        </details>

        {/* Lesson content panel */}
        {selectedLesson && (
          <LessonPanel
            lesson={selectedLesson}
            saving={savingLessonId === selectedLesson.id}
            saveError={saveError}
            onMarkComplete={handleMarkComplete}
            onPrev={() => prevLesson && handleSelectLesson(prevLesson.id)}
            onNext={() => nextLesson && handleSelectLesson(nextLesson.id)}
            hasPrev={prevLesson !== null}
            hasNext={nextLesson !== null}
            prevTitle={prevLesson?.title ?? null}
            nextTitle={nextLesson?.title ?? null}
          />
        )}

        {/* Desktop sidebar outline (hidden on mobile) */}
        <aside className="hidden lg:block" aria-label="Course outline">
          <CourseOutline
            content={content}
            selectedLessonId={selectedLessonId}
            onSelectLesson={handleSelectLesson}
          />
        </aside>

      </div>
    </div>
  );
}
