import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bone } from '../../common/skeletons/Bone';
import { CoursePreviewCard } from '../../../features/catalog/components/CoursePreviewCard';
import { getPublishedCourses, type CourseCatalogItem } from '../../../api/courses';

const MAX_RECENT = 6;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export function RecentCourses() {
  const [state, setState] = useState<LoadState>('loading');
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPublishedCourses()
      .then((data) => {
        if (cancelled) return;
        if (data.length === 0) {
          setState('empty');
          return;
        }
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setCourses(sorted.slice(0, MAX_RECENT));
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Discovery preview degrades silently: an empty catalog or a failed
  // background fetch omits the section rather than showing a broken-looking
  // panel on the public marketing surface. The full catalog at /courses
  // already owns the "no courses available yet" / "could not load" states.
  if (state === 'empty' || state === 'error') return null;

  return (
    <section aria-labelledby="recent-courses-heading" className="bg-bg-base py-14 lg:py-20">
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 id="recent-courses-heading" className="text-headline text-text-primary">
              Recently added courses
            </h2>
            <p className="text-body-sm text-text-secondary mt-1">
              The newest structured courses published on Learnova.
            </p>
          </div>
          <Link
            to="/courses"
            className="hidden sm:inline-flex items-center gap-1 text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem whitespace-nowrap flex-shrink-0"
          >
            View all courses <span aria-hidden="true">→</span>
          </Link>
        </div>

        {state === 'loading' ? (
          <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-border-default bg-surface"
              >
                <Bone className="aspect-video w-full rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <Bone className="h-3 w-1/3" />
                  <Bone className="h-4 w-3/4" />
                  <Bone className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {courses.map((course) => (
              <CoursePreviewCard key={course.id} course={course} />
            ))}
          </div>
        )}

        {/* Mobile-only "view all" — the header link is hidden below sm so the
            heading has room; this keeps the affordance reachable on phones. */}
        <div className="mt-8 sm:hidden">
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            View all courses <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
