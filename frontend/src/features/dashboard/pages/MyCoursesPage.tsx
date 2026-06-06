import { useState } from 'react';
import { CourseCard, type Course } from '../../../components/dashboard/CourseCard';
import { FeaturedCourseRow } from '../../../components/dashboard/FeaturedCourseRow';
import { FilterTabs } from '../../../components/ui/FilterTabs';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'in-progress' | 'completed';

// ── Mock data ─────────────────────────────────────────────────────────────────

const HOURS_LEARNED = 34;

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const [filter, setFilter] = useState<FilterValue>('all');

  const enrolled = COURSES.length;
  const completed = COURSES.filter(c => c.progress === 100).length;

  const filteredCourses = COURSES.filter(c => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed')   return c.progress === 100;
    return true;
  });

  // Feature the first in-progress course as a "Next up" row, then drop it from
  // the grid. Derived from the data (no hardcoded id), so it keeps working once
  // real API courses replace the mock list.
  const nextUpCourse = filteredCourses.find(c => c.progress > 0 && c.progress < 100);
  const gridCourses = nextUpCourse
    ? filteredCourses.filter(c => c.id !== nextUpCourse.id)
    : filteredCourses;

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">My Courses</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          All your enrolled courses in one place.
        </p>
      </div>

      {/* 2. Summary strip ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 mb-8 text-body-sm text-text-secondary"
        aria-label="Course statistics"
      >
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{enrolled}</span>
          courses enrolled
        </span>
        <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{completed}</span>
          completed
        </span>
        <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
        <span className="flex items-center">
          <span className="font-semibold text-text-primary mr-1.5">{HOURS_LEARNED}h</span>
          learned
        </span>
      </div>

      {/* 3. Filter toolbar + course list ──────────────────────────────── */}
      <section aria-label="Course list" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-body-sm text-text-secondary">
            {filteredCourses.length}{' '}
            {filteredCourses.length === 1 ? 'course' : 'courses'}
          </span>

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

    </div>
  );
}
