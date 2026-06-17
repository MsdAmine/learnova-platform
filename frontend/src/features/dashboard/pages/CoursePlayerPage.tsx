import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronDown, X } from 'lucide-react';
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
import {
  listLearnerCourseQuizzes,
  getLearnerQuizDetail,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizAttempt,
  listQuizAttempts,
  type LearnerQuizSummaryResponse,
  type LearnerQuizDetailResponse,
  type QuizAttemptResponse,
} from '../../../api/learnerQuizzes';
import { getMyCertificates, issueCertificate } from '../../../api/certificates';

// ── HTTP status helper ──────────────────────────────────────────────────────
// Reads the response status off an unknown Axios error without importing axios.

function getStatus(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

type TabKey = 'lessons' | 'quizzes';

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

function formatAttemptDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

// ── Certificate panel ─────────────────────────────────────────────────────────
// Shown only once the learner has finished every lesson. Checks for an
// existing certificate first so a learner who already issued one sees
// "View certificate" instead of a redundant issue action.

type CertificateStatus = 'checking' | 'none' | 'issuing' | 'issued' | 'error';

function CertificatePanel({
  courseId,
  courseTitle,
}: {
  courseId: number;
  courseTitle: string;
}) {
  const [status, setStatus] = useState<CertificateStatus>('checking');
  const [certificateId, setCertificateId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = { cancelled: false };
    getMyCertificates()
      .then(list => {
        if (token.cancelled) return;
        const existing = list.find(c => c.courseId === courseId);
        if (existing) {
          setCertificateId(existing.id);
          setStatus('issued');
        } else {
          setStatus('none');
        }
      })
      .catch(() => {
        if (!token.cancelled) setStatus('none');
      });
    return () => {
      token.cancelled = true;
    };
  }, [courseId]);

  async function handleIssue() {
    setStatus('issuing');
    setErrorMessage(null);
    try {
      const certificate = await issueCertificate(courseId);
      setCertificateId(certificate.id);
      setStatus('issued');
    } catch (err) {
      setErrorMessage(
        getStatus(err) === 409
          ? 'This course is not fully completed yet, so a certificate cannot be issued.'
          : 'We could not issue your certificate. Please try again.',
      );
      setStatus('error');
    }
  }

  if (status === 'checking') return null;

  return (
    <section
      aria-label="Certificate"
      className="bg-surface border border-border-default rounded-lg p-4 mt-4"
    >
      <h2 className="text-title-sm font-semibold text-text-primary mb-1">
        Course completed
      </h2>
      <p className="text-body-sm text-text-secondary mb-3">
        {status === 'issued'
          ? `You've earned a certificate for ${courseTitle}.`
          : `You've finished every lesson in ${courseTitle}. You can issue a certificate of completion.`}
      </p>

      {status === 'error' && errorMessage && (
        <p className="text-body-sm text-error mb-3" role="alert">
          {errorMessage}
        </p>
      )}

      {status === 'issued' && certificateId != null ? (
        <Button
          variant="secondary"
          size="sm"
          asChild
          aria-label={`View certificate for ${courseTitle}`}
        >
          <Link to={`/dashboard/certificates/${certificateId}`}>View certificate</Link>
        </Button>
      ) : (
        <Button
          size="sm"
          loading={status === 'issuing'}
          disabled={status === 'issuing'}
          aria-label={`Issue certificate for ${courseTitle}`}
          onClick={handleIssue}
        >
          Issue certificate
        </Button>
      )}
    </section>
  );
}

// ── Quiz list skeleton ────────────────────────────────────────────────────────

function QuizListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {[0, 1].map(i => (
        <div
          key={i}
          className="bg-surface border border-border-default rounded-lg p-4"
        >
          <Bone className="h-5 w-1/2 mb-2" />
          <Bone className="h-4 w-3/4 mb-3" />
          <Bone className="h-9 w-28 rounded-md" />
        </div>
      ))}
    </div>
  );
}

// ── Quiz status badge ────────────────────────────────────────────────────────

function quizStatusBadge(latest: QuizAttemptResponse | undefined): {
  variant: 'default' | 'azure' | 'salem' | 'coral';
  label: string;
} {
  if (!latest) return { variant: 'default', label: 'Not started' };
  if (latest.status === 'IN_PROGRESS') return { variant: 'azure', label: 'In progress' };
  return latest.passed
    ? { variant: 'salem', label: 'Passed' }
    : { variant: 'coral', label: 'Not passed' };
}

// ── Attempt history (compact, collapsible) ─────────────────────────────────────

function AttemptHistory({
  quizTitle,
  attempts,
  resuming,
  viewingAttemptId,
  onResume,
  onViewResult,
}: {
  quizTitle: string;
  attempts: QuizAttemptResponse[];
  resuming: boolean;
  viewingAttemptId: number | null;
  onResume: () => void;
  onViewResult: (attemptId: number) => void;
}) {
  return (
    <details className="mt-3 group">
      <summary
        className={cn(
          'cursor-pointer list-none inline-flex items-center gap-1 min-h-[32px]',
          'text-caption font-medium text-text-secondary',
          'hover:text-text-primary motion-safe:transition-colors duration-fast',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <ChevronDown
          size={13}
          aria-hidden="true"
          className="motion-safe:transition-transform duration-fast group-open:rotate-180"
        />
        Attempt history{attempts.length > 0 ? ` (${attempts.length})` : ''}
      </summary>
      <div className="mt-2">
        {attempts.length === 0 ? (
          <p className="text-caption text-text-muted">No attempts yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {attempts.map((a, i) => {
              const number = attempts.length - i;
              const submitted = a.status === 'SUBMITTED';
              const busy = submitted ? viewingAttemptId === a.id : resuming;
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 flex-wrap rounded-md border border-border-default px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-caption font-medium text-text-primary">
                      Attempt {number}
                      {submitted && a.submittedAt && (
                        <span className="text-text-muted"> · {formatAttemptDate(a.submittedAt)}</span>
                      )}
                    </p>
                    <p className="text-caption text-text-muted">
                      {submitted
                        ? `${a.scorePercentage ?? 0}% · ${a.passed ? 'Passed' : 'Not passed'}`
                        : 'In progress'}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busy}
                    disabled={busy}
                    aria-label={
                      submitted
                        ? `View result for attempt ${number} of ${quizTitle}`
                        : `Resume attempt ${number} of ${quizTitle}`
                    }
                    onClick={() => (submitted ? onViewResult(a.id) : onResume())}
                  >
                    {submitted ? 'View result' : 'Resume'}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}

// ── Quiz card (list item) ──────────────────────────────────────────────────────

function QuizCard({
  quiz,
  attempts,
  starting,
  viewingAttemptId,
  onStart,
  onViewResult,
}: {
  quiz: LearnerQuizSummaryResponse;
  attempts: QuizAttemptResponse[];
  starting: boolean;
  viewingAttemptId: number | null;
  onStart: (id: number) => void;
  onViewResult: (attemptId: number) => void;
}) {
  const latest = attempts[0];
  const badge = quizStatusBadge(latest);
  const latestSubmitted = latest?.status === 'SUBMITTED';
  const latestInProgress = latest?.status === 'IN_PROGRESS';

  return (
    <article className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <h3 className="text-title-sm font-semibold text-text-primary break-words">
          {quiz.title}
        </h3>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      {quiz.description && (
        <p className="text-body-sm text-text-secondary mt-1 break-words">
          {quiz.description}
        </p>
      )}
      <p className="text-caption text-text-muted mt-2">
        Passing score: {quiz.passingScore}%
        {latestSubmitted && latest.scorePercentage != null && (
          <span> · Latest score: {latest.scorePercentage}%</span>
        )}
      </p>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {!latest && (
          <Button
            size="sm"
            loading={starting}
            disabled={starting}
            aria-label={`Start ${quiz.title}`}
            onClick={() => onStart(quiz.id)}
          >
            Start quiz
          </Button>
        )}
        {latestInProgress && (
          <Button
            size="sm"
            loading={starting}
            disabled={starting}
            aria-label={`Resume ${quiz.title}`}
            onClick={() => onStart(quiz.id)}
          >
            Resume
          </Button>
        )}
        {latestSubmitted && (
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={viewingAttemptId === latest.id}
              disabled={viewingAttemptId === latest.id}
              aria-label={`View result for ${quiz.title}`}
              onClick={() => onViewResult(latest.id)}
            >
              View result
            </Button>
            <Button
              size="sm"
              loading={starting}
              disabled={starting}
              aria-label={`Retake ${quiz.title}`}
              onClick={() => onStart(quiz.id)}
            >
              Retake quiz
            </Button>
          </>
        )}
      </div>

      <AttemptHistory
        quizTitle={quiz.title}
        attempts={attempts}
        resuming={starting}
        viewingAttemptId={viewingAttemptId}
        onResume={() => onStart(quiz.id)}
        onViewResult={onViewResult}
      />
    </article>
  );
}

// ── Quiz taking panel ──────────────────────────────────────────────────────────

function QuizTakingPanel({
  detail,
  selections,
  onSelect,
  onSubmit,
  submitting,
  submitError,
  allAnswered,
  onBack,
}: {
  detail: LearnerQuizDetailResponse;
  selections: Record<number, number>;
  onSelect: (questionId: number, optionId: number) => void;
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
  allAnswered: boolean;
  onBack: () => void;
}) {
  return (
    <section
      aria-labelledby="quiz-taking-heading"
      className="bg-surface border border-border-default rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <h3
          id="quiz-taking-heading"
          className="text-title-sm font-semibold text-text-primary break-words"
        >
          {detail.title}
        </h3>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to quizzes
        </Button>
      </div>

      {detail.description && (
        <p className="text-body-sm text-text-secondary mb-2 break-words">
          {detail.description}
        </p>
      )}
      <p className="text-caption text-text-muted mb-5">
        Passing score: {detail.passingScore}%
      </p>

      <ol className="flex flex-col gap-6">
        {detail.questions.map((q, i) => (
          <li key={q.id}>
            <fieldset className="border-0 p-0 m-0 min-w-0">
              <legend className="text-body-sm font-medium text-text-primary mb-2 break-words">
                <span className="text-text-muted mr-1">{i + 1}.</span>
                {q.content}
                <span className="ml-2 text-caption text-text-muted">
                  {q.points} pt{q.points === 1 ? '' : 's'}
                </span>
              </legend>
              <div className="flex flex-col gap-1">
                {q.answerOptions.map(o => {
                  const inputId = `q${q.id}-o${o.id}`;
                  return (
                    <label
                      key={o.id}
                      htmlFor={inputId}
                      className={cn(
                        'flex items-start gap-2.5 rounded-md px-2 py-2 min-h-[44px] cursor-pointer',
                        'motion-safe:transition-colors duration-fast',
                        'hover:bg-surface-elevated',
                        'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-salem',
                      )}
                    >
                      <input
                        id={inputId}
                        type="radio"
                        name={`question-${q.id}`}
                        value={o.id}
                        checked={selections[q.id] === o.id}
                        onChange={() => onSelect(q.id, o.id)}
                        className="mt-0.5 h-4 w-4 flex-shrink-0 accent-salem"
                      />
                      <span className="text-body-sm text-text-primary break-words">
                        {o.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      {submitError && (
        <p className="text-body-sm text-error mt-4" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <Button
          size="sm"
          onClick={onSubmit}
          loading={submitting}
          disabled={!allAnswered || submitting}
          aria-label="Submit quiz"
        >
          Submit quiz
        </Button>
        {!allAnswered && (
          <p className="text-caption text-text-muted">
            Answer every question to submit.
          </p>
        )}
      </div>
    </section>
  );
}

// ── Quiz result panel ──────────────────────────────────────────────────────────

function QuizResultPanel({
  detail,
  attempt,
  onBack,
}: {
  detail: LearnerQuizDetailResponse;
  attempt: QuizAttemptResponse;
  onBack: () => void;
}) {
  const passed = attempt.passed === true;
  const resultById = new Map(attempt.answerResults.map(r => [r.questionId, r]));

  return (
    <section
      aria-labelledby="quiz-result-heading"
      className="bg-surface border border-border-default rounded-lg p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <h3
          id="quiz-result-heading"
          className="text-title-sm font-semibold text-text-primary break-words"
        >
          {detail.title}
        </h3>
        <Button variant="secondary" size="sm" onClick={onBack}>
          Back to quizzes
        </Button>
      </div>

      <div className="bg-surface-elevated rounded-md p-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <span className="text-title font-semibold text-text-primary">
            {attempt.scorePercentage ?? 0}%
          </span>
          <Badge variant={passed ? 'salem' : 'coral'}>
            {passed ? 'Passed' : 'Not passed'}
          </Badge>
        </div>
        <p className="text-body-sm text-text-secondary">
          You scored {attempt.earnedPoints ?? 0} of {attempt.totalPoints ?? 0} points.
          {' '}Passing score is {detail.passingScore}%.
        </p>
      </div>

      <h4 className="text-body-sm font-semibold text-text-primary mb-2">
        Your answers
      </h4>
      <ol className="flex flex-col gap-3">
        {detail.questions.map((q, i) => {
          const r = resultById.get(q.id);
          const selected = q.answerOptions.find(o => o.id === r?.selectedOptionId);
          const correct = r?.correct === true;
          return (
            <li
              key={q.id}
              className="border border-border-default rounded-md p-3"
            >
              <p className="text-body-sm font-medium text-text-primary mb-1 break-words">
                <span className="text-text-muted mr-1">{i + 1}.</span>
                {q.content}
              </p>
              {r ? (
                <>
                  <p className="text-body-sm text-text-secondary break-words">
                    Your answer: {selected ? selected.optionText : '—'}
                  </p>
                  <p className="mt-1.5">
                    <Badge variant={correct ? 'salem' : 'coral'} className="gap-1">
                      {correct ? (
                        <Check size={10} aria-hidden="true" />
                      ) : (
                        <X size={10} aria-hidden="true" />
                      )}
                      {correct ? 'Correct' : 'Incorrect'}
                    </Badge>
                  </p>
                </>
              ) : (
                <p className="text-caption text-text-muted">
                  Result unavailable for this question.
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ── Quizzes tab ────────────────────────────────────────────────────────────────

function QuizzesTab({ courseId, active }: { courseId: number; active: boolean }) {
  const [listStatus, setListStatus] = useState<'idle' | 'loaded' | 'error'>('idle');
  const [quizzes, setQuizzes] = useState<LearnerQuizSummaryResponse[]>([]);
  const [attemptsByQuiz, setAttemptsByQuiz] = useState<Record<number, QuizAttemptResponse[]>>({});

  const [phase, setPhase] = useState<'list' | 'taking' | 'result'>('list');
  const [detail, setDetail] = useState<LearnerQuizDetailResponse | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptResponse | null>(null);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [viewingAttemptId, setViewingAttemptId] = useState<number | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch the quiz list the first time the tab is opened (status 'idle'), and
  // again after a retry (handleListRetry resets status to 'idle'). Only async
  // setState in the promise callbacks — never synchronous in the effect body,
  // per the react-hooks/set-state-in-effect rule observed elsewhere in this file.
  useEffect(() => {
    if (!active || listStatus !== 'idle') return;
    const token = { cancelled: false };
    listLearnerCourseQuizzes(courseId)
      .then(data => {
        if (token.cancelled) return;
        setQuizzes(data);
        setListStatus('loaded');
      })
      .catch(() => {
        if (!token.cancelled) setListStatus('error');
      });
    return () => {
      token.cancelled = true;
    };
  }, [active, courseId, listStatus]);

  // Attempt history per quiz is fetched once the quiz list loads. A failed
  // fetch for a given quiz degrades gracefully — that card just shows
  // "Not started" instead of blocking the rest of the tab, mirroring the
  // non-blocking wishlist fetch pattern used elsewhere in this codebase.
  useEffect(() => {
    if (listStatus !== 'loaded' || quizzes.length === 0) return;
    const token = { cancelled: false };
    Promise.allSettled(
      quizzes.map(q => listQuizAttempts(q.id).then(data => ({ quizId: q.id, data }))),
    ).then(results => {
      if (token.cancelled) return;
      setAttemptsByQuiz(prev => {
        const next = { ...prev };
        for (const r of results) {
          if (r.status === 'fulfilled') next[r.value.quizId] = r.value.data;
        }
        return next;
      });
    });
    return () => {
      token.cancelled = true;
    };
  }, [listStatus, quizzes]);

  function upsertAttempt(quizId: number, updated: QuizAttemptResponse) {
    setAttemptsByQuiz(prev => {
      const list = prev[quizId] ?? [];
      const idx = list.findIndex(a => a.id === updated.id);
      const nextList = idx >= 0
        ? list.map((a, i) => (i === idx ? updated : a))
        : [updated, ...list];
      return { ...prev, [quizId]: nextList };
    });
  }

  function handleListRetry() {
    setListStatus('idle');
  }

  async function handleStart(quizId: number) {
    setStartingId(quizId);
    setStartError(null);
    try {
      const startedAttempt = await startQuizAttempt(quizId);
      const quizDetail = await getLearnerQuizDetail(quizId);
      setAttempt(startedAttempt);
      setDetail(quizDetail);
      setSelections({});
      setSubmitError(null);
      setPhase('taking');
      upsertAttempt(quizId, startedAttempt);
    } catch (err) {
      setStartError(
        getStatus(err) === 404
          ? 'This quiz is no longer available.'
          : 'We could not start this quiz. Please try again.',
      );
    } finally {
      setStartingId(null);
    }
  }

  async function handleViewResult(quizId: number, attemptId: number) {
    setViewingAttemptId(attemptId);
    setViewError(null);
    try {
      const quizDetail = await getLearnerQuizDetail(quizId);
      const attemptResult = await getQuizAttempt(attemptId);
      setDetail(quizDetail);
      setAttempt(attemptResult);
      setPhase('result');
    } catch (err) {
      setViewError(
        getStatus(err) === 404
          ? 'This attempt is no longer available.'
          : 'We could not load this result. Please try again.',
      );
    } finally {
      setViewingAttemptId(null);
    }
  }

  function handleSelect(questionId: number, optionId: number) {
    setSelections(prev => ({ ...prev, [questionId]: optionId }));
  }

  function handleBackToList() {
    setPhase('list');
    setDetail(null);
    setAttempt(null);
    setSelections({});
    setSubmitError(null);
  }

  const allAnswered =
    detail != null &&
    detail.questions.length > 0 &&
    detail.questions.every(q => selections[q.id] != null);

  async function handleSubmit() {
    if (!detail || !attempt || !allAnswered) return;
    // Build the answer set by iterating the questions so it always matches the
    // backend's strict "every question, no extras" rule (a partial set → 400).
    const answers: { questionId: number; selectedOptionId: number }[] = [];
    for (const q of detail.questions) {
      const selectedOptionId = selections[q.id];
      if (selectedOptionId == null) return;
      answers.push({ questionId: q.id, selectedOptionId });
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await submitQuizAttempt(attempt.id, { answers });
      setAttempt(result);
      setPhase('result');
      upsertAttempt(result.quizId, result);
    } catch (err) {
      const status = getStatus(err);
      if (status === 409) {
        // Already submitted — surface the stored result if we can fetch it.
        try {
          const existing = await getQuizAttempt(attempt.id);
          setAttempt(existing);
          setPhase('result');
          upsertAttempt(existing.quizId, existing);
        } catch {
          setSubmitError('This attempt has already been submitted.');
        }
      } else if (status === 400) {
        setSubmitError('Some answers were not accepted. Please review and try again.');
      } else if (status === 404) {
        setSubmitError('This quiz is no longer available.');
      } else {
        setSubmitError('We could not submit your answers. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'taking' && detail) {
    return (
      <QuizTakingPanel
        detail={detail}
        selections={selections}
        onSelect={handleSelect}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitError={submitError}
        allAnswered={allAnswered}
        onBack={handleBackToList}
      />
    );
  }

  if (phase === 'result' && detail && attempt) {
    return <QuizResultPanel detail={detail} attempt={attempt} onBack={handleBackToList} />;
  }

  // phase === 'list'
  if (listStatus === 'idle') return <QuizListSkeleton />;
  if (listStatus === 'error') {
    return <StatePanel message="We could not load quizzes." onRetry={handleListRetry} />;
  }
  if (quizzes.length === 0) {
    return <StatePanel message="No quizzes available yet." />;
  }
  return (
    <div className="flex flex-col gap-4">
      {startError && (
        <p className="text-body-sm text-error" role="alert">
          {startError}
        </p>
      )}
      {viewError && (
        <p className="text-body-sm text-error" role="alert">
          {viewError}
        </p>
      )}
      {quizzes.map(quiz => (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          attempts={attemptsByQuiz[quiz.id] ?? []}
          starting={startingId === quiz.id}
          viewingAttemptId={viewingAttemptId}
          onStart={handleStart}
          onViewResult={attemptId => handleViewResult(quiz.id, attemptId)}
        />
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
  const [activeTab, setActiveTab] = useState<TabKey>('lessons');

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

  const tabs: TabKey[] = ['lessons', 'quizzes'];

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Back link */}
      <Link to="/dashboard/courses" className={backLinkClass}>
        <ArrowLeft size={13} aria-hidden="true" />
        Back to My Courses
      </Link>

      {/* Course header */}
      <div className="mb-6">
        <h1 className="text-title font-semibold text-text-primary">
          {content.courseTitle}
        </h1>
        {hasLessons && (
          <>
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
          </>
        )}
        {hasLessons && progressPercentage === 100 && (
          <CertificatePanel courseId={courseId} courseTitle={content.courseTitle} />
        )}
      </div>

      {/* Tabs: Lessons | Quizzes */}
      <div
        role="tablist"
        aria-label="Course player sections"
        className="flex items-center gap-1 border-b border-border-default mb-6"
      >
        {tabs.map(tab => {
          const selected = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              id={`tab-${tab}`}
              aria-selected={selected}
              aria-controls={`panel-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'min-h-[44px] px-4 -mb-px border-b-2 text-body-sm font-medium',
                'motion-safe:transition-colors duration-fast',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
                selected
                  ? 'border-salem text-salem'
                  : 'border-transparent text-text-secondary hover:text-text-primary',
              )}
            >
              {tab === 'lessons' ? 'Lessons' : 'Quizzes'}
            </button>
          );
        })}
      </div>

      {/* Lessons panel */}
      <div
        role="tabpanel"
        id="panel-lessons"
        aria-labelledby="tab-lessons"
        hidden={activeTab !== 'lessons'}
      >
        {!hasLessons ? (
          <StatePanel
            title="No lessons available yet"
            message="This course does not have published lessons yet."
          />
        ) : (
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
        )}
      </div>

      {/* Quizzes panel */}
      <div
        role="tabpanel"
        id="panel-quizzes"
        aria-labelledby="tab-quizzes"
        hidden={activeTab !== 'quizzes'}
      >
        <QuizzesTab courseId={courseId} active={activeTab === 'quizzes'} />
      </div>

    </div>
  );
}
