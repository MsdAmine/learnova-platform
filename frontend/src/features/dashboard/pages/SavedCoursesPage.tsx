import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import { getMyWishlist, removeFromWishlist } from '../../../api/wishlist';
import type { WishlistCourse } from '../../../api/wishlist';
import type { CourseLevel } from '../../../api/courses';

// ── Helpers ───────────────────────────────────────────────────────────────────

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

// ── Loading skeleton ───────────────────────────────────────────────────────────

function SavedCoursesSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[0, 1, 2].map(i => (
        <div key={i} className="rounded-lg overflow-hidden border border-border-default bg-surface">
          <Bone className="aspect-video w-full rounded-none" />
          <div className="p-4 flex flex-col gap-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
            <Bone className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface SavedCourseCardProps {
  course: WishlistCourse;
  removing: boolean;
  hasError: boolean;
  onRemove: (id: number) => void;
}

function SavedCourseCard({ course, removing, hasError, onRemove }: SavedCourseCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const gradient = gradientForId(course.id);
  const showThumbnail = course.thumbnailUrl && !thumbnailError;

  return (
    <article
      className="bg-surface border border-border-default rounded-lg overflow-hidden hover:border-border-hover motion-safe:transition-colors duration-fast"
      aria-label={course.title}
    >
      {showThumbnail ? (
        <img
          src={course.thumbnailUrl ?? undefined}
          alt=""
          className="aspect-video w-full object-cover"
          loading="lazy"
          onError={() => setThumbnailError(true)}
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-video w-full"
          style={{ background: `linear-gradient(140deg, ${gradient.from}, ${gradient.to})` }}
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {course.categoryName && (
            <Badge variant="default">{course.categoryName}</Badge>
          )}
          <span className="text-caption text-text-muted">
            {LEVEL_LABELS[course.level] ?? course.level}
          </span>
        </div>

        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 mb-1">
          <Link
            to={`/courses/${course.id}`}
            className="hover:text-salem motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            {course.title}
          </Link>
        </h3>

        {course.description && (
          <p className="text-caption text-text-secondary line-clamp-2 mb-2">
            {course.description}
          </p>
        )}

        <p className="text-caption text-text-secondary mb-3">
          {course.instructorName}
        </p>

        <div aria-live="polite" className="flex items-center justify-between gap-2">
          <Link
            to={`/courses/${course.id}`}
            aria-label={`View details for ${course.title}`}
            className="inline-flex items-center min-h-[44px] text-caption font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
          >
            View details
          </Link>
          <Button
            variant="ghost"
            size="sm"
            loading={removing}
            aria-label={`Remove ${course.title} from saved courses`}
            onClick={() => onRemove(course.id)}
          >
            Remove
          </Button>
        </div>

        {hasError && (
          <p role="alert" className="mt-2 text-caption text-text-secondary">
            We could not remove this course from saved courses.
          </p>
        )}
      </div>
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SavedCoursesPage() {
  // Initial state is loading=true; the mount effect never calls setLoading(true)
  // directly, avoiding synchronous setState-in-effect (matches useEnrollments pattern).
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [courses, setCourses] = useState<WishlistCourse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [removingCourseId, setRemovingCourseId] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<number, true>>({});

  const fetchWishlist = useCallback((token: { cancelled: boolean }) => {
    getMyWishlist()
      .then(page => {
        if (token.cancelled) return;
        setCourses(page.content);
        setTotalElements(page.totalElements);
      })
      .catch(() => {
        if (token.cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (token.cancelled) return;
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = { cancelled: false };
    fetchWishlist(token);
    return () => { token.cancelled = true; };
  }, [fetchWishlist]);

  // Called from event handler ("Try again"), so resetting flags here is safe.
  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchWishlist({ cancelled: false });
  }, [fetchWishlist]);

  const handleRemove = useCallback(async (courseId: number) => {
    setRemovingCourseId(courseId);
    setRowErrors(prev => {
      const next = { ...prev };
      delete next[courseId];
      return next;
    });

    try {
      await removeFromWishlist(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
      setTotalElements(prev => prev - 1);
    } catch (err) {
      const status = getHttpStatus(err);
      if (status === 404) {
        // Stale: already removed — treat as success
        setCourses(prev => prev.filter(c => c.id !== courseId));
        setTotalElements(prev => prev - 1);
      } else if (status !== 401 && status !== 403) {
        setRowErrors(prev => ({ ...prev, [courseId]: true }));
      }
    } finally {
      setRemovingCourseId(null);
    }
  }, []);

  const savedCount = courses.length;
  const hasSavedCourses = savedCount > 0;
  const isTruncated = !loading && !error && totalElements > savedCount;

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Saved courses</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Courses you saved for later.
        </p>
      </div>

      {/* 2. Summary strip — only when list is resolved and non-empty */}
      {!loading && !error && hasSavedCourses && (
        <p className="text-body-sm text-text-secondary mb-8">
          <span className="font-semibold text-text-primary">{savedCount}</span>{' '}
          {savedCount === 1 ? 'saved course' : 'saved courses'}
        </p>
      )}

      {/* 3. State ladder */}
      {loading ? (
        <SavedCoursesSkeleton />
      ) : error ? (
        <StatePanel
          message="We could not load your saved courses."
          onRetry={handleRetry}
        />
      ) : !hasSavedCourses ? (
        <div>
          <StatePanel
            title="No saved courses yet"
            message="Save courses from the catalog to find them here later."
          />
          <div className="mt-4 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center min-h-[44px] text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              Explore courses
            </Link>
          </div>
        </div>
      ) : (
        <section aria-label="Saved courses">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
            {courses.map(course => (
              <SavedCourseCard
                key={course.id}
                course={course}
                removing={removingCourseId === course.id}
                hasError={!!rowErrors[course.id]}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {isTruncated && (
            <p className="mt-6 text-caption text-text-muted">
              Showing the first {savedCount} of {totalElements} saved courses.
            </p>
          )}
        </section>
      )}

    </div>
  );
}
