import { useMemo, useState } from 'react';
import { CourseCard } from '../../../components/dashboard/CourseCard';
import { FeaturedCourseRow } from '../../../components/dashboard/FeaturedCourseRow';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { Bone } from '../../../components/common/skeletons/Bone';
import { useEnrollments } from '../../../hooks/useEnrollments';
import { enrollmentToCourse } from '../../../api/enrollments';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'in-progress' | 'completed';

// ── Loading skeleton ───────────────────────────────────────────────────────────

function MyCoursesSkeleton() {
  return (
    <section aria-hidden="true" className="mb-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
        <Bone className="h-4 w-20" />
        <div className="flex items-center gap-1">
          <Bone className="h-7 w-10 rounded-md" />
          <Bone className="h-7 w-24 rounded-md" />
          <Bone className="h-7 w-20 rounded-md" />
        </div>
      </div>
      <Bone className="h-20 w-full rounded-lg mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyCoursesPage() {
  const [filter, setFilter] = useState<FilterValue>('all');
  const { enrollments, loading, error, reload } = useEnrollments();

  const courses = useMemo(() => enrollments.map(enrollmentToCourse), [enrollments]);

  const enrolled = courses.length;
  const completed = courses.filter(c => c.progress === 100).length;

  const filteredCourses = courses.filter(c => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed')   return c.progress === 100;
    return true;
  });

  // Feature the first in-progress course as a "Next up" row, then drop it from
  // the grid. Derived from the data (no hardcoded id).
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

      {/* 2. Summary strip — only counts we can derive from real data ──────── */}
      {!loading && !error && courses.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary"
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
        </div>
      )}

      {/* 3. States: loading / error / empty / list ───────────────────────── */}
      {loading ? (
        <MyCoursesSkeleton />
      ) : error ? (
        <StatePanel message="We could not load your enrollments." onRetry={reload} />
      ) : courses.length === 0 ? (
        <StatePanel message="You are not enrolled in any courses yet." />
      ) : (
        <section aria-label="Course list" className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
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
      )}

    </div>
  );
}
