import { useState } from 'react';
import { Award, Calendar, Download, Play } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { CourseCard, type Course } from '../../../components/dashboard/CourseCard';
import { FeaturedCourseRow } from '../../../components/dashboard/FeaturedCourseRow';
import { FilterTabs } from '../../../components/ui/FilterTabs';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'in-progress' | 'completed';

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

  // Surface the next-up course (NEXT_UP_ID) as a featured row when the filter
  // includes it, then drop it from the grid. Pure derivation, no mutation —
  // NEXT_UP_ID is kept here on purpose so it stays distinct from the hardcoded
  // "Continue Learning" card above (which features the highest-progress course).
  const nextUpCourse = filteredCourses.find(
    c => c.id === NEXT_UP_ID && c.progress > 0 && c.progress < 100,
  );
  const gridCourses = nextUpCourse
    ? filteredCourses.filter(c => c.id !== nextUpCourse.id)
    : filteredCourses;

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
        className="flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary"
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
                <ProgressBar
                  value={CONTINUE_COURSE.progress}
                  label={`${CONTINUE_COURSE.title} progress`}
                />
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
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
          <h2
            id="courses-heading"
            className="text-title-sm font-semibold text-text-primary"
          >
            My Courses
          </h2>

          <FilterTabs
            options={[
              { value: 'all',         label: 'All'         },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed',   label: 'Completed'   },
            ]}
            value={filter}
            onChange={(v) => setFilter(v)}
            aria-label="Filter courses"
          />
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
                {gridCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
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
