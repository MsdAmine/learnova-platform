import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navbar } from '../../../components/marketing/landing/Navbar';
import { Footer } from '../../../components/marketing/landing/Footer';
import { Input } from '../../../components/ui/Input';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { useAuth } from '../../../context/AuthContext';
import { getPublishedCourses, type CourseCatalogItem } from '../../../api/courses';
import { getMyEnrollments } from '../../../api/enrollments';
import { CourseCatalogCard } from '../components/CourseCatalogCard';

const ALL_CATEGORIES = 'All';

// Past roughly six categories the tabs would wrap to a second line, so the
// toolbar falls back to a native select styled with the Input tokens.
const MAX_FILTER_TABS = 6;

// ── Loading skeleton ───────────────────────────────────────────────────────────

function CatalogSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-8">
        <Bone className="h-7 w-36 mb-2" />
        <Bone className="h-4 w-48" />
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Bone className="h-12 w-full sm:max-w-sm" />
        <div className="flex items-center gap-1">
          <Bone className="h-7 w-10 rounded-md" />
          <Bone className="h-7 w-24 rounded-md" />
          <Bone className="h-7 w-20 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} className="rounded-lg overflow-hidden border border-border-default bg-surface">
            <Bone className="aspect-video w-full rounded-none" />
            <div className="p-4 flex flex-col gap-2">
              <Bone className="h-3 w-1/3" />
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseCatalogPage() {
  const { isAuthenticated } = useAuth();

  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [enrolledIds, setEnrolledIds] = useState<ReadonlySet<number>>(new Set());

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);

  const fetchCatalog = useCallback((token: { cancelled: boolean }) => {
    getPublishedCourses()
      .then((data) => {
        if (!token.cancelled) setCourses(data);
      })
      .catch(() => {
        if (!token.cancelled) setError(true);
      })
      .finally(() => {
        if (!token.cancelled) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = { cancelled: false };
    fetchCatalog(token);
    return () => {
      token.cancelled = true;
    };
  }, [fetchCatalog]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchCatalog({ cancelled: false });
  }, [fetchCatalog]);

  // Enrollments are fetched only for authenticated visitors; guests never call
  // the learner endpoint. A failure degrades gracefully: every card renders
  // not-enrolled and the 409 path on enroll catches duplicates.
  const refreshEnrollments = useCallback(() => {
    if (!isAuthenticated) return;
    getMyEnrollments()
      .then((data) => setEnrolledIds(new Set(data.map(e => e.courseId))))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    refreshEnrollments();
  }, [refreshEnrollments]);

  const markEnrolled = useCallback((courseId: number) => {
    setEnrolledIds(prev => new Set(prev).add(courseId));
  }, []);

  const categories = useMemo(() => {
    const distinct = new Set<string>();
    for (const course of courses) {
      if (course.categoryName) distinct.add(course.categoryName);
    }
    return [ALL_CATEGORIES, ...[...distinct].sort((a, b) => a.localeCompare(b))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return courses.filter((course) => {
      if (category !== ALL_CATEGORIES && course.categoryName !== category) return false;
      if (!needle) return true;
      return (
        course.title.toLowerCase().includes(needle) ||
        course.description.toLowerCase().includes(needle) ||
        course.instructorName.toLowerCase().includes(needle)
      );
    });
  }, [courses, query, category]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-salem focus:text-white focus:px-6 focus:py-3 focus:rounded-md focus:text-button focus:leading-none focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-salem"
      >
        Skip to main content
      </a>
      <Navbar forceSolid />
      <main id="main-content" tabIndex={-1} className="bg-bg-base">
        {/* Spacer clearing the fixed navbar */}
        <div className="h-nav-mobile md:h-nav" aria-hidden="true" />
        <div className="px-8 py-12 pb-16 max-w-container mx-auto">
          {loading ? (
            <CatalogSkeleton />
          ) : error ? (
            <>
              <PageHeader />
              <div role="status">
                <StatePanel
                  message="We could not load the course catalog."
                  onRetry={reload}
                />
              </div>
            </>
          ) : courses.length === 0 ? (
            <>
              <PageHeader />
              <StatePanel
                title="No courses available yet"
                message="Published courses will appear here when instructors make them available."
              />
            </>
          ) : (
            <>
              <PageHeader />

              {/* Toolbar: client-side refinement over the fetched list */}
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:max-w-sm">
                  <label htmlFor="catalog-search" className="sr-only">
                    Search courses
                  </label>
                  <Input
                    id="catalog-search"
                    type="search"
                    placeholder="Search courses"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                {categories.length > 1 && (
                  categories.length - 1 > MAX_FILTER_TABS ? (
                    <div>
                      <label htmlFor="catalog-category" className="sr-only">
                        Filter by category
                      </label>
                      <select
                        id="catalog-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-surface text-text-primary text-body border border-border-default rounded-md py-3 px-4 transition-colors duration-fast focus:outline-none focus:border-salem focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-salem"
                      >
                        {categories.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <FilterTabs
                        options={categories.map(name => ({ value: name, label: name }))}
                        value={category}
                        onChange={setCategory}
                        aria-label="Filter by category"
                      />
                    </div>
                  )
                )}
              </div>

              {filteredCourses.length === 0 ? (
                <p className="text-body-sm text-text-muted py-10 text-center">
                  No courses match your filters.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                  {filteredCourses.map(course => (
                    <CourseCatalogCard
                      key={course.id}
                      course={course}
                      isAuthenticated={isAuthenticated}
                      enrolled={enrolledIds.has(course.id)}
                      onEnrolled={markEnrolled}
                      onStaleEnrollment={refreshEnrollments}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-title font-semibold text-text-primary">Explore courses</h1>
      <p className="text-body-sm text-text-secondary mt-1">
        Find structured courses designed for focused professional growth.
      </p>
    </div>
  );
}
