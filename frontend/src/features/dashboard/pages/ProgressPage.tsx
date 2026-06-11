import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { useEnrollments } from '../../../hooks/useEnrollments';
import { enrollmentToCourse } from '../../../api/enrollments';
import type { Course } from '../../../components/dashboard/courseCardUtils';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayActivity {
  label: string;
  active: boolean;
}

// ── Local placeholder data ──────────────────────────────────────────────────────
// Weekly activity has no backend source yet. Kept as a static local placeholder
// so the page structure is preserved; replace once a learning-activity endpoint
// exists. Not derived from real enrollments.
const WEEK_ACTIVITY: DayActivity[] = [
  { label: 'M', active: true  },
  { label: 'T', active: true  },
  { label: 'W', active: false },
  { label: 'T', active: true  },
  { label: 'F', active: false },
  { label: 'S', active: false },
  { label: 'S', active: false },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function WeekStrip({ days }: { days: DayActivity[] }) {
  const activeDays = days.filter(d => d.active).length;
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-body-sm font-medium text-text-secondary">This week</span>
        <span className="text-caption text-text-secondary">{activeDays} of 7 days active</span>
      </div>
      <div className="flex items-center gap-2" aria-hidden="true">
        {days.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 w-8 sm:w-9">
            <div
              className={`w-7 h-7 rounded-full ${
                day.active ? 'bg-salem' : 'bg-surface-elevated'
              }`}
            />
            <span className="text-caption text-text-secondary">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InProgressRow({ course }: { course: Course }) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
            {course.title}
          </h3>
          <p className="text-caption text-text-secondary">{course.instructor}</p>
        </div>
        <button
          type="button"
          aria-label={`Continue ${course.title}`}
          className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
        >
          Continue <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={course.progress} label={`${course.title} progress`} />
        </div>
        <span className="text-caption text-text-secondary w-8 text-right flex-shrink-0">
          {course.progress}%
        </span>
      </div>
    </li>
  );
}

function CompletedRow({ course }: { course: Course }) {
  return (
    <li className="px-5 py-3.5 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary">{course.instructor}</p>
      </div>
      <Badge variant="anzac" className="flex-shrink-0">Done</Badge>
    </li>
  );
}

function NotStartedRow({ course }: { course: Course }) {
  return (
    <li className="px-5 py-3.5 flex items-center gap-4">
      <div className="min-w-0 flex-1">
        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary">{course.instructor}</p>
      </div>
      <button
        type="button"
        aria-label={`Start ${course.title}`}
        className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0 rounded-sm min-h-[44px] px-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
      >
        Start <ArrowRight size={11} aria-hidden="true" />
      </button>
    </li>
  );
}

function ProgressSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-4 w-40 mb-3" />
      <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
        {[0, 1, 2].map(i => (
          <li key={i} className="px-5 py-4 flex flex-col gap-2">
            <Bone className="h-4 w-2/3" />
            <Bone className="h-3 w-1/3" />
            <Bone className="h-1 w-full rounded-full mt-1" />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { enrollments, loading, error, reload } = useEnrollments();

  const courses = useMemo(() => enrollments.map(enrollmentToCourse), [enrollments]);

  const inProgress = courses.filter(c => c.progress > 0 && c.progress < 100);
  const completed   = courses.filter(c => c.progress === 100);
  const notStarted  = courses.filter(c => c.progress === 0);

  return (
    <div className="px-4 py-6 pb-14 sm:px-8 sm:py-8 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Progress</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Your learning activity and course completion over time.
        </p>
      </div>

      {loading ? (
        <ProgressSkeleton />
      ) : error ? (
        <StatePanel message="We could not load your enrollments." onRetry={reload} />
      ) : courses.length === 0 ? (
        <StatePanel message="Progress will appear here after you enroll in a course." />
      ) : (
        <>
          {/* 2. Summary strip — derived counts only ─────────────────────── */}
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mb-8 text-body-sm text-text-secondary"
            aria-label="Learning statistics"
          >
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">{courses.length}</span>
              enrolled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">{inProgress.length}</span>
              in progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-semibold text-text-primary">{completed.length}</span>
              completed
            </span>
          </div>

          {/* 3. Weekly activity strip (local placeholder) ───────────────── */}
          <WeekStrip days={WEEK_ACTIVITY} />

          {/* 4. In progress ─────────────────────────────────────────────── */}
          {inProgress.length > 0 && (
            <section className="mb-6" aria-label="In progress courses">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                In progress ({inProgress.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {inProgress.map(course => (
                  <InProgressRow key={course.id} course={course} />
                ))}
              </ul>
            </section>
          )}

          {/* 5. Completed ───────────────────────────────────────────────── */}
          {completed.length > 0 && (
            <section className="mb-6" aria-label="Completed courses">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                Completed ({completed.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {completed.map(course => (
                  <CompletedRow key={course.id} course={course} />
                ))}
              </ul>
              <button
                type="button"
                className="flex items-center gap-1 text-body-sm font-medium text-salem min-h-[44px] rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
              >
                View certificates <ArrowRight size={13} aria-hidden="true" />
              </button>
            </section>
          )}

          {/* 6. Not started ─────────────────────────────────────────────── */}
          {notStarted.length > 0 && (
            <section className="mb-6" aria-label="Not started courses">
              <h2 className="text-body-sm font-medium text-text-secondary mb-3">
                Not started ({notStarted.length})
              </h2>
              <ul className="list-none bg-surface border border-border-default rounded-lg divide-y divide-border-default">
                {notStarted.map(course => (
                  <NotStartedRow key={course.id} course={course} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

    </div>
  );
}
