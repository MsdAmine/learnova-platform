import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, Download, Play } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { CourseCard } from '../../../components/dashboard/CourseCard';
import { FeaturedCourseRow } from '../../../components/dashboard/FeaturedCourseRow';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { Bone } from '../../../components/common/skeletons/Bone';
import { useEnrollments } from '../../../hooks/useEnrollments';
import { enrollmentToCourse } from '../../../api/enrollments';
import { courseGradient } from '../../../components/dashboard/courseCardUtils';

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

// ── Local placeholder data ──────────────────────────────────────────────────────
// Live sessions and certificates have no backend endpoint yet, so they remain
// static local placeholders. Course data below is wired to the real enrollment
// API; these two sections are the documented next step.

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
  const { enrollments, loading, error, reload } = useEnrollments();

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const courses = useMemo(() => enrollments.map(enrollmentToCourse), [enrollments]);

  const inProgressCount = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const completedCount = courses.filter(c => c.progress === 100).length;

  // "Continue Learning" surfaces the in-progress course with the highest
  // progress. Pure derivation — no hardcoded id.
  const continueCourse = useMemo(
    () =>
      courses
        .filter(c => c.progress > 0 && c.progress < 100)
        .sort((a, b) => b.progress - a.progress)[0] ?? null,
    [courses],
  );

  const filteredCourses = courses.filter(c => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed')   return c.progress === 100;
    return true;
  });

  // Feature the first in-progress course as a "Next up" row, then drop it from
  // the grid (distinct from the Continue Learning card above).
  const nextUpCourse = filteredCourses.find(c => c.progress > 0 && c.progress < 100);
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

      {/* 2. Summary strip — derived counts only ───────────────────────── */}
      {!loading && !error && courses.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary"
          aria-label="Learning statistics"
        >
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{courses.length}</span>
            courses enrolled
          </span>
          <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{inProgressCount}</span>
            in progress
          </span>
          <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{completedCount}</span>
            completed
          </span>
        </div>
      )}

      {/* 3. Continue Learning ─────────────────────────────────────────── */}
      {loading ? (
        <section className="mb-8" aria-hidden="true">
          <Bone className="h-5 w-40 mb-4" />
          <Bone className="h-44 w-full rounded-lg" />
        </section>
      ) : continueCourse ? (
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
                  background: courseGradient(continueCourse),
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
                  <h3 className="text-title-sm font-semibold text-text-primary mb-1 max-w-[48ch]">
                    {continueCourse.title}
                  </h3>
                  <p className="text-body-sm text-text-secondary">
                    by {continueCourse.instructor}
                  </p>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-caption text-text-muted">Progress</span>
                    <span className="text-caption font-medium text-text-secondary">
                      {continueCourse.progress}% complete
                    </span>
                  </div>
                  <ProgressBar
                    value={continueCourse.progress}
                    label={`${continueCourse.title} progress`}
                  />
                  <div className="mt-4">
                    <Button variant="primary" size="md" asChild>
                      <Link to={`/dashboard/courses/${continueCourse.id}`}>Continue</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. My Courses ────────────────────────────────────────────────── */}
      <section aria-labelledby="courses-heading" className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
          <h2
            id="courses-heading"
            className="text-title-sm font-semibold text-text-primary"
          >
            My Courses
          </h2>

          {!loading && !error && courses.length > 0 && (
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
          )}
        </div>

        {loading ? (
          <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg overflow-hidden border border-border-default bg-surface">
                <Bone className="aspect-video w-full rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <Bone className="h-4 w-3/4" />
                  <Bone className="h-3 w-1/2" />
                  <Bone className="h-1 w-full rounded-full mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <StatePanel message="We could not load your enrollments." onRetry={reload} />
        ) : courses.length === 0 ? (
          <StatePanel message="You are not enrolled in any courses yet." />
        ) : filteredCourses.length === 0 ? (
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

      {/* 5. Upcoming Live Sessions (local placeholder — no backend yet) ── */}
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

      {/* 6. Certificates (local placeholder — no backend yet) ─────────── */}
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
