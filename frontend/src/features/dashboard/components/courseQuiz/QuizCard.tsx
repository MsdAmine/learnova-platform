import { ChevronDown } from 'lucide-react';
import { cn } from '../../../../lib/cn';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import type {
  LearnerQuizSummaryResponse,
  QuizAttemptResponse,
} from '../../../../api/learnerQuizzes';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatAttemptDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

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
// In-progress attempts only ever show their status text — never a score or
// correctness, since the backend never sends those fields for an attempt that
// hasn't been submitted yet (see QuizAttemptResponse in learnerQuizzes.ts).

export function AttemptHistory({
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

export function QuizCard({
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
