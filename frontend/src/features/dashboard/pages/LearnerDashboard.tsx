import { useState } from 'react';
import { Award, Calendar, Download, Play, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'in-progress' | 'completed';

interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  gradient: { from: string; to: string };
}

interface Session {
  id: number;
  title: string;
  course: string;
  date: string;
}

interface Certificate {
  id: number;
  course: string;
  issuedAt: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────

// The in-progress course to surface as "next up" in the My Courses list
const NEXT_UP_ID = 2;

const CONTINUE_COURSE = {
  title: 'Advanced React Patterns and Architecture',
  instructor: 'Sarah Chen',
  section: 'Module 4: Compound Components',
  progress: 68,
  gradient: { from: '#032117', to: '#1A3B2E' },
};

const STATS = [
  { label: 'Courses Enrolled', value: 5 },
  { label: 'Lessons Completed', value: 42 },
  { label: 'Certificates Earned', value: 2 },
  { label: 'Hours Learned', value: 34 },
];

const COURSES: Course[] = [
  {
    id: 1,
    title: 'Advanced React Patterns and Architecture',
    instructor: 'Sarah Chen',
    progress: 68,
    gradient: { from: '#032117', to: '#1A3B2E' },
  },
  {
    id: 2,
    title: 'TypeScript for Production Systems',
    instructor: 'Marcus Webb',
    progress: 35,
    gradient: { from: '#1A3B2E', to: '#5C7B6F' },
  },
  {
    id: 3,
    title: 'System Design Fundamentals',
    instructor: 'Priya Mehta',
    progress: 0,
    gradient: { from: '#02180F', to: '#032117' },
  },
  {
    id: 4,
    title: 'Node.js Backend Engineering',
    instructor: 'James Okafor',
    progress: 100,
    gradient: { from: '#5C7B6F', to: '#C9D5D0' },
  },
  {
    id: 5,
    title: 'PostgreSQL for App Developers',
    instructor: 'Ana Torres',
    progress: 18,
    gradient: { from: '#032117', to: '#98AFA6' },
  },
];

const SESSIONS: Session[] = [
  {
    id: 1,
    title: 'Live Q&A: Building Scalable APIs',
    course: 'Node.js Backend Engineering',
    date: 'Fri, Jun 6, 3:00 PM',
  },
  {
    id: 2,
    title: 'Code Review Workshop',
    course: 'Advanced React Patterns and Architecture',
    date: 'Mon, Jun 9, 10:00 AM',
  },
  {
    id: 3,
    title: 'Career AMA with Sarah Chen',
    course: 'Advanced React Patterns and Architecture',
    date: 'Wed, Jun 11, 5:00 PM',
  },
];

const CERTIFICATES: Certificate[] = [
  { id: 1, course: 'JavaScript Fundamentals', issuedAt: 'March 2026' },
  { id: 2, course: 'Node.js Backend Engineering', issuedAt: 'May 2026' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
      <div
        className="h-full bg-salem rounded-full"
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

// Full-width featured row for the prioritised next-up course
function FeaturedCourseRow({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-hover rounded-lg overflow-hidden mb-4">
      <div className="flex">
        <div
          className="w-20 flex-shrink-0 hidden sm:block"
          style={{
            background: `linear-gradient(140deg, ${course.gradient.from}, ${course.gradient.to})`,
          }}
          aria-hidden="true"
        />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-caption text-text-muted mb-1">Next up</p>
              <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
                {course.title}
              </h3>
              <p className="text-caption text-text-secondary">{course.instructor}</p>
            </div>
            <button
              type="button"
              aria-label={`Continue ${course.title}`}
              className={cn(
                'flex items-center gap-1 text-body-sm font-medium text-salem flex-shrink-0 mt-0.5',
                'hover:text-salem-400 transition-colors duration-fast',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
              )}
            >
              Continue <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-caption text-text-muted">Progress</span>
              <span className="text-caption font-medium text-text-secondary">
                {course.progress}% complete
              </span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Completed: no thumbnail, no progress bar; Anzac "Done" badge signals achievement
function CompletedCourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 flex-1">
          {course.title}
        </h3>
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium flex-shrink-0 mt-0.5 bg-anzac-50 text-anzac-700"
          aria-label="Completed"
        >
          <Check size={10} aria-hidden="true" />
          Done
        </span>
      </div>
      <p className="text-caption text-text-secondary">{course.instructor}</p>
    </div>
  );
}

// Not started: text-only, no thumbnail, no progress — low visual weight by design
function NotStartedCourseCard({ course }: { course: Course }) {
  return (
    <div
      className={cn(
        'bg-surface border border-border-default rounded-lg p-4',
        'hover:border-border-hover transition-colors duration-fast',
      )}
    >
      <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 mb-1">
        {course.title}
      </h3>
      <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-muted">Not started</span>
        <button
          type="button"
          aria-label={`Start ${course.title}`}
          className={cn(
            'flex items-center gap-1 text-caption font-medium text-salem',
            'hover:text-salem-400 transition-colors duration-fast',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
          )}
        >
          Start <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

// Standard in-progress card: gradient thumbnail + progress bar
function InProgressCourseCard({ course }: { course: Course }) {
  return (
    <div
      className={cn(
        'bg-surface border border-border-default rounded-lg overflow-hidden',
        'transition-shadow duration-standard hover:shadow-hover-lift',
      )}
    >
      <div
        className="aspect-video w-full"
        style={{
          background: `linear-gradient(140deg, ${course.gradient.from}, ${course.gradient.to})`,
        }}
        aria-hidden="true"
      />
      <div className="p-4">
        <h3 className="text-body-sm font-semibold text-text-primary mb-0.5 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
        <ProgressBar value={course.progress} />
        <p className="text-caption text-text-muted mt-1.5">{course.progress}% complete</p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>('all');

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const filteredCourses = COURSES.filter(c => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed')   return c.progress === 100;
    return true;
  });

  // Surface the next-up course as a featured row only when the filter includes it
  const nextUpCourse = filteredCourses.find(
    c => c.id === NEXT_UP_ID && c.progress > 0 && c.progress < 100,
  );
  const gridCourses = filteredCourses.filter(c => c.id !== nextUpCourse?.id);

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Dashboard</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Welcome back, {firstName}
        </p>
      </div>

      {/* 2. Summary strip ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 mb-8 text-body-sm text-text-secondary"
        aria-label="Learning statistics"
      >
        {STATS.map(({ label, value }, i) => (
          <span key={label} className="flex items-center">
            {i > 0 && (
              <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
            )}
            <span className="font-semibold text-text-primary mr-1.5">{value}</span>
            {label.toLowerCase()}
          </span>
        ))}
      </div>

      {/* 3. Continue Learning ─────────────────────────────────────────── */}
      <section aria-labelledby="continue-heading" className="mb-8">
        <h2
          id="continue-heading"
          className="text-title-sm font-semibold text-text-primary mb-4"
        >
          Continue Learning
        </h2>

        <div className="bg-surface border border-border-default rounded-lg overflow-hidden">
          <div className="flex">
            {/* Thumbnail */}
            <div
              className="w-[280px] flex-shrink-0 hidden sm:flex items-center justify-center"
              style={{
                background: `linear-gradient(140deg, ${CONTINUE_COURSE.gradient.from}, ${CONTINUE_COURSE.gradient.to})`,
                minHeight: '172px',
              }}
              aria-hidden="true"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.12]"
              >
                <Play
                  size={18}
                  className="translate-x-px text-white/75"
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col justify-between min-h-[172px]">
              <div>
                <p className="text-caption text-text-muted mb-1.5">
                  {CONTINUE_COURSE.section}
                </p>
                <h3 className="text-title-sm font-semibold text-text-primary mb-1 max-w-[48ch]">
                  {CONTINUE_COURSE.title}
                </h3>
                <p className="text-body-sm text-text-secondary">
                  by {CONTINUE_COURSE.instructor}
                </p>
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-caption text-text-muted">Progress</span>
                  <span className="text-caption font-medium text-text-secondary">
                    {CONTINUE_COURSE.progress}% complete
                  </span>
                </div>
                <ProgressBar value={CONTINUE_COURSE.progress} />
                <div className="mt-4">
                  <Button variant="primary" size="md">Continue</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. My Courses ────────────────────────────────────────────────── */}
      <section aria-labelledby="courses-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="courses-heading"
            className="text-title-sm font-semibold text-text-primary"
          >
            My Courses
          </h2>

          <div
            className="flex items-center gap-0.5"
            role="group"
            aria-label="Filter courses"
          >
            {(
              [
                { value: 'all',         label: 'All'         },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed',   label: 'Completed'   },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'px-3 py-1.5 text-body-sm font-medium rounded-md transition-colors duration-fast',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
                  filter === value
                    ? 'bg-salem-50 text-salem'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <p className="text-body-sm text-text-muted py-10 text-center">
            No courses match this filter.
          </p>
        ) : (
          <>
            {nextUpCourse && <FeaturedCourseRow course={nextUpCourse} />}

            {gridCourses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {gridCourses.map(course => {
                  if (course.progress === 100)
                    return <CompletedCourseCard key={course.id} course={course} />;
                  if (course.progress === 0)
                    return <NotStartedCourseCard key={course.id} course={course} />;
                  return <InProgressCourseCard key={course.id} course={course} />;
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* 5. Upcoming Live Sessions ────────────────────────────────────── */}
      <section aria-labelledby="sessions-heading" className="mb-8">
        <h2
          id="sessions-heading"
          className="text-title-sm font-semibold text-text-primary mb-4"
        >
          Upcoming Live Sessions
        </h2>

        <div className="bg-surface border border-border-default rounded-lg divide-y divide-border-default">
          {SESSIONS.map(session => (
            <div
              key={session.id}
              className="flex items-center justify-between px-5 py-4 gap-4"
            >
              <div className="min-w-0">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {session.title}
                </p>
                <p className="text-caption text-text-secondary mt-0.5">
                  {session.course}
                </p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-caption text-text-muted whitespace-nowrap">
                  <Calendar size={12} aria-hidden="true" />
                  {session.date}
                </div>
                <Button variant="secondary" size="sm">Join</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Certificates ──────────────────────────────────────────────── */}
      <section aria-labelledby="certs-heading">
        <h2
          id="certs-heading"
          className="text-title-sm font-semibold text-text-primary mb-4"
        >
          Certificates
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          {CERTIFICATES.map(cert => (
            <div
              key={cert.id}
              className="flex items-center gap-4 bg-surface border border-border-default rounded-lg px-5 py-4 flex-1"
            >
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 bg-anzac-50"
                aria-hidden="true"
              >
                <Award
                  size={18}
                  className="text-anzac"
                  aria-hidden="true"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {cert.course}
                </p>
                <p className="text-caption text-text-muted mt-0.5">
                  Issued {cert.issuedAt}
                </p>
              </div>

              <button
                type="button"
                aria-label={`Download ${cert.course} certificate`}
                className={cn(
                  'flex items-center gap-1.5 text-body-sm font-medium text-salem flex-shrink-0',
                  'hover:text-salem-400 transition-colors duration-fast',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
                )}
              >
                <Download size={13} aria-hidden="true" />
                Download
              </button>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
