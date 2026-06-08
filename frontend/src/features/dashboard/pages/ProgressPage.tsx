import { ArrowRight } from 'lucide-react';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Badge } from '../../../components/ui/Badge';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CourseProgress {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
}

interface DayActivity {
  label: string;
  active: boolean;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const HOURS_LEARNED = 34;

const COURSES: CourseProgress[] = [
  {
    id: 1,
    title: 'Advanced React Patterns and Architecture',
    instructor: 'Sarah Chen',
    progress: 68,
    lessonsCompleted: 7,
    totalLessons: 12,
  },
  {
    id: 2,
    title: 'TypeScript for Production Systems',
    instructor: 'Marcus Webb',
    progress: 35,
    lessonsCompleted: 4,
    totalLessons: 11,
  },
  {
    id: 3,
    title: 'System Design Fundamentals',
    instructor: 'Priya Mehta',
    progress: 0,
    lessonsCompleted: 0,
    totalLessons: 14,
  },
  {
    id: 4,
    title: 'Node.js Backend Engineering',
    instructor: 'James Okafor',
    progress: 100,
    lessonsCompleted: 15,
    totalLessons: 15,
  },
  {
    id: 5,
    title: 'PostgreSQL for App Developers',
    instructor: 'Ana Torres',
    progress: 18,
    lessonsCompleted: 2,
    totalLessons: 10,
  },
];

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
                day.active ? 'bg-azure' : 'bg-surface-elevated'
              }`}
            />
            <span className="text-caption text-text-secondary">{day.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InProgressRow({ course }: { course: CourseProgress }) {
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
          className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0 rounded-sm p-1 -m-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
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
      <p className="text-caption text-text-secondary mt-1.5">
        {course.lessonsCompleted} of {course.totalLessons} lessons
      </p>
    </li>
  );
}

function CompletedRow({ course }: { course: CourseProgress }) {
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

function NotStartedRow({ course }: { course: CourseProgress }) {
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
        className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0 p-1 -m-1 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
      >
        Start <ArrowRight size={11} aria-hidden="true" />
      </button>
    </li>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const inProgress = COURSES.filter(c => c.progress > 0 && c.progress < 100);
  const completed   = COURSES.filter(c => c.progress === 100);
  const notStarted  = COURSES.filter(c => c.progress === 0);

  return (
    <div className="px-4 py-6 pb-14 sm:px-8 sm:py-8 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Progress</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Your learning activity and course completion over time.
        </p>
      </div>

      {/* 2. Summary strip ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 mb-8 text-body-sm text-text-secondary"
        aria-label="Learning statistics"
      >
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{HOURS_LEARNED}h</span>
          learned
        </span>
        <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{COURSES.length}</span>
          enrolled
        </span>
        <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{inProgress.length}</span>
          in progress
        </span>
        <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{completed.length}</span>
          completed
        </span>
      </div>

      {/* 3. Weekly activity strip ─────────────────────────────────────── */}
      <WeekStrip days={WEEK_ACTIVITY} />

      {/* 4. In progress ───────────────────────────────────────────────── */}
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

      {/* 5. Completed ─────────────────────────────────────────────────── */}
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
            className="flex items-center gap-1 text-body-sm font-medium text-salem mt-3 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            View certificates <ArrowRight size={13} aria-hidden="true" />
          </button>
        </section>
      )}

      {/* 6. Not started ───────────────────────────────────────────────── */}
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

    </div>
  );
}
