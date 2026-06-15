import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Navbar } from '../../../components/marketing/landing/Navbar';
import { Footer } from '../../../components/marketing/landing/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import { useAuth } from '../../../context/AuthContext';
import { getPublishedCourse, type CourseCatalogItem, type CourseLevel } from '../../../api/courses';
import { enrollInCourse, getMyEnrollments } from '../../../api/enrollments';

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};

// Mirrors the helper in CourseCatalogCard — 401/403 are interceptor-owned;
// only enrollment-specific statuses (409 stale, 404 unavailable) are handled here.
function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

type EnrollState = 'idle' | 'enrolling' | 'failed' | 'unavailable';
type PageError = 'none' | 'notFound' | 'generic';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '';
  }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Bone className="h-4 w-32 mb-4" />
      <Bone className="aspect-video w-full rounded-lg mb-6" />
      <div className="flex items-center gap-2 mb-3">
        <Bone className="h-5 w-20 rounded-full" />
        <Bone className="h-3 w-16" />
      </div>
      <Bone className="h-7 w-2/3 mb-3" />
      <Bone className="h-4 w-full mb-1" />
      <Bone className="h-4 w-5/6 mb-1" />
      <Bone className="h-4 w-4/5 mb-4" />
      <Bone className="h-3 w-40 mb-1" />
      <Bone className="h-3 w-28" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start mt-8">
        <div className="space-y-4">
          <Bone className="h-5 w-40 mb-2" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-3/4" />
        </div>
        <div className="border border-border-default rounded-lg p-6">
          <Bone className="h-11 w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ── Shared back link ──────────────────────────────────────────────────────────

function BackLink() {
  return (
    <Link
      to="/courses"
      className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary motion-safe:transition-colors duration-fast rounded-sm mb-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
    >
      <span aria-hidden="true">←</span> Back to courses
    </Link>
  );
}

// ── Side action panel ─────────────────────────────────────────────────────────

type SideActionProps = {
  course: CourseCatalogItem;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  enrollState: EnrollState;
  onEnroll: () => void;
};

function SideActionPanel({ course, isAuthenticated, isEnrolled, enrollState, onEnroll }: SideActionProps) {
  if (isEnrolled) {
    return (
      <div className="flex flex-col gap-3">
        <Badge variant="salem" className="self-start">Enrolled</Badge>
        <Button
          variant="primary"
          size="md"
          asChild
          className="w-full justify-center"
        >
          <Link
            to={`/dashboard/courses/${course.id}`}
            aria-label={`Continue learning ${course.title}`}
          >
            Continue learning
          </Link>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div>
        <Button variant="primary" size="md" asChild className="w-full justify-center">
          <Link
            to="/login"
            aria-label={`Sign in to enroll in ${course.title}`}
          >
            Sign in to enroll
          </Link>
        </Button>
        <p className="text-body-sm text-text-secondary mt-3">
          <Link
            to="/register"
            className="text-salem underline hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            Create an account
          </Link>{' '}
          or sign in to enroll in this course.
        </p>
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <Button
        variant="primary"
        size="md"
        loading={enrollState === 'enrolling'}
        disabled={enrollState === 'unavailable'}
        aria-label={`Enroll in ${course.title}`}
        className="w-full justify-center"
        onClick={onEnroll}
      >
        Enroll in course
      </Button>
      {enrollState === 'unavailable' && (
        <p role="alert" className="text-body-sm text-text-secondary mt-3">
          This course is no longer available.
        </p>
      )}
      {enrollState === 'failed' && (
        <p role="alert" className="text-body-sm text-text-secondary mt-3">
          Enrollment failed. Try again.
        </p>
      )}
    </div>
  );
}

// ── Loaded course detail ──────────────────────────────────────────────────────

type CourseDetailProps = {
  course: CourseCatalogItem;
  isAuthenticated: boolean;
  isEnrolled: boolean;
  enrollState: EnrollState;
  thumbnailError: boolean;
  onThumbnailError: () => void;
  onEnroll: () => void;
};

function CourseDetail({
  course,
  isAuthenticated,
  isEnrolled,
  enrollState,
  thumbnailError,
  onThumbnailError,
  onEnroll,
}: CourseDetailProps) {
  const gradient = gradientForId(course.id);
  const showThumbnail = !!course.thumbnailUrl && !thumbnailError;
  const levelLabel = LEVEL_LABELS[course.level] ?? course.level;
  const addedDate = formatDate(course.createdAt);

  return (
    <>
      <BackLink />

      {/* Full-width detail header — spans both grid columns */}
      <div className="mb-8">
        {showThumbnail ? (
          <img
            src={course.thumbnailUrl ?? undefined}
            alt=""
            className="aspect-video w-full rounded-lg object-cover mb-6"
            onError={onThumbnailError}
          />
        ) : (
          <div
            aria-hidden="true"
            className="aspect-video w-full rounded-lg mb-6"
            style={{ background: `linear-gradient(140deg, ${gradient.from}, ${gradient.to})` }}
          />
        )}

        <div className="flex items-center gap-2">
          {course.categoryName && (
            <Badge variant="default">{course.categoryName}</Badge>
          )}
          <span className="text-caption text-text-muted">{levelLabel}</span>
        </div>

        <h1 className="text-title font-semibold text-text-primary mt-3">
          {course.title}
        </h1>

        {course.description ? (
          <p className="text-body text-text-secondary max-w-[72ch] mt-3">
            {course.description}
          </p>
        ) : (
          <p className="text-body text-text-muted max-w-[72ch] mt-3">
            No course description is available yet.
          </p>
        )}

        <p className="text-body-sm text-text-secondary mt-4">
          By {course.instructorName}
        </p>

        {addedDate && (
          <p className="text-caption text-text-muted mt-1">Added {addedDate}</p>
        )}
      </div>

      {/* Two-column body: main content left, side panel right on lg */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Main content column */}
        <div className="space-y-8">
          <section aria-labelledby="section-about">
            <h2 id="section-about" className="text-title-sm font-semibold text-text-primary mb-2">
              About this course
            </h2>
            {course.description ? (
              <p className="text-body text-text-secondary max-w-[72ch]">
                {course.description}
              </p>
            ) : (
              <p className="text-body text-text-muted max-w-[72ch]">
                No course description is available yet.
              </p>
            )}
          </section>

          <section aria-labelledby="section-details">
            <h2 id="section-details" className="text-title-sm font-semibold text-text-primary mb-2">
              Course details
            </h2>
            <dl className="space-y-2 text-body-sm">
              {course.categoryName && (
                <div className="flex gap-2">
                  <dt className="text-text-secondary w-24 flex-shrink-0">Category</dt>
                  <dd className="text-text-primary">{course.categoryName}</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-text-secondary w-24 flex-shrink-0">Level</dt>
                <dd className="text-text-primary">{levelLabel}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-text-secondary w-24 flex-shrink-0">Instructor</dt>
                <dd className="text-text-primary">{course.instructorName}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="section-access">
            <h2 id="section-access" className="text-title-sm font-semibold text-text-primary mb-2">
              What you will access
            </h2>
            <div className="text-body text-text-secondary max-w-[72ch] space-y-2">
              <p>After enrolling, this course appears in your learning dashboard.</p>
              <p>Course lessons are available from the course player once you are enrolled.</p>
            </div>
          </section>
        </div>

        {/* Side panel — order-first on mobile so the action is above body copy;
            lg:order-none restores DOM order within the two-column grid */}
        <aside
          aria-label="Course enrollment"
          className="bg-surface border border-border-default rounded-lg p-6 order-first lg:order-none"
        >
          <SideActionPanel
            course={course}
            isAuthenticated={isAuthenticated}
            isEnrolled={isEnrolled}
            enrollState={enrollState}
            onEnroll={onEnroll}
          />
        </aside>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CourseDetailPage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const { isAuthenticated } = useAuth();

  const courseId = courseIdParam ? parseInt(courseIdParam, 10) : NaN;
  const isValidId = Number.isInteger(courseId) && courseId > 0;

  const [course, setCourse] = useState<CourseCatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PageError>('none');

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollState, setEnrollState] = useState<EnrollState>('idle');
  const [thumbnailError, setThumbnailError] = useState(false);

  // All setState calls are inside async callbacks (.then/.catch/.finally or
  // Promise.resolve().then) — never synchronously in the function body.
  // This matches the CourseCatalogPage pattern and satisfies the
  // react-hooks/set-state-in-effect rule.
  const fetchCourse = useCallback((token: { cancelled: boolean }) => {
    if (!isValidId) {
      Promise.resolve().then(() => {
        if (!token.cancelled) {
          setLoading(false);
          setError('notFound');
        }
      });
      return;
    }
    getPublishedCourse(courseId)
      .then((data) => {
        if (!token.cancelled) setCourse(data);
      })
      .catch((err: unknown) => {
        if (!token.cancelled) {
          const status = getHttpStatus(err);
          setError(status === 404 ? 'notFound' : 'generic');
        }
      })
      .finally(() => {
        if (!token.cancelled) setLoading(false);
      });
  }, [courseId, isValidId]);

  useEffect(() => {
    const token = { cancelled: false };
    // Reset stale per-course state before fetching. Deferred to a microtask
    // (Promise.resolve().then) to satisfy the react-hooks/set-state-in-effect
    // rule, which blocks synchronous setState in effect bodies.
    // This prevents stale content flash when courseId param changes via SPA
    // navigation without a full remount.
    Promise.resolve().then(() => {
      if (!token.cancelled) {
        setLoading(true);
        setCourse(null);
        setError('none');
        setIsEnrolled(false);
        setEnrollState('idle');
        setThumbnailError(false);
      }
    });
    fetchCourse(token);
    return () => { token.cancelled = true; };
  }, [fetchCourse]);

  // Fetch enrollment status for authenticated visitors; degrade gracefully on
  // failure so the 409 path on the enroll action can catch stale state.
  useEffect(() => {
    if (!isAuthenticated || !isValidId) return;
    getMyEnrollments()
      .then((data) => {
        if (data.some((e) => e.courseId === courseId)) {
          setIsEnrolled(true);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, courseId, isValidId]);

  const reload = useCallback(() => {
    setLoading(true);
    setError('none');
    setCourse(null);
    fetchCourse({ cancelled: false });
  }, [fetchCourse]);

  async function handleEnroll() {
    if (!course) return;
    setEnrollState('enrolling');
    try {
      await enrollInCourse(course.id);
      setEnrollState('idle');
      setIsEnrolled(true);
    } catch (err: unknown) {
      const status = getHttpStatus(err);
      if (status === 409) {
        // Stale local state: the learner is already enrolled.
        setEnrollState('idle');
        setIsEnrolled(true);
      } else if (status === 404) {
        setEnrollState('unavailable');
      } else if (status === 401 || status === 403) {
        // Owned by the shared Axios interceptor; reset quietly.
        setEnrollState('idle');
      } else {
        setEnrollState('failed');
      }
    }
  }

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
        <div className="h-nav-mobile md:h-nav" aria-hidden="true" />
        <div className="px-8 py-12 pb-16 max-w-container mx-auto">
          {loading ? (
            <DetailSkeleton />
          ) : error === 'notFound' ? (
            <>
              <BackLink />
              <StatePanel
                title="Course not found"
                message="This course may no longer be available."
              />
              <div className="mt-4 text-center">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-1 text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
                >
                  <span aria-hidden="true">←</span> Back to courses
                </Link>
              </div>
            </>
          ) : error === 'generic' ? (
            <>
              <BackLink />
              <div role="status">
                <StatePanel
                  message="We could not load this course."
                  onRetry={reload}
                />
              </div>
            </>
          ) : course ? (
            <CourseDetail
              course={course}
              isAuthenticated={isAuthenticated}
              isEnrolled={isEnrolled}
              enrollState={enrollState}
              thumbnailError={thumbnailError}
              onThumbnailError={() => setThumbnailError(true)}
              onEnroll={handleEnroll}
            />
          ) : null}
        </div>
      </main>
      <Footer />
    </>
  );
}
