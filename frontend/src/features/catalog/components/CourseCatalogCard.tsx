import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import { enrollInCourse } from '../../../api/enrollments';
import type { CourseCatalogItem, CourseLevel } from '../../../api/courses';

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};

// 401/403 are owned by the shared Axios response interceptor; the card only
// branches on the enrollment-specific statuses (409 stale, 404 unpublished).
function getHttpStatus(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    return (error as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

type EnrollState = 'idle' | 'enrolling' | 'failed' | 'unavailable';

interface CourseCatalogCardProps {
  course: CourseCatalogItem;
  isAuthenticated: boolean;
  enrolled: boolean;
  onEnrolled: (courseId: number) => void;
  onStaleEnrollment: () => void;
}

/**
 * Decision-driven catalog card consuming CourseCatalogItem. Distinct from the
 * dashboard CourseCard (enrollment-state-driven); they share tokens, not code.
 * Not a clickable surface in v1: it contains interactive children and there is
 * no detail route yet, so hover is border intensification only (Flat-At-Rest).
 */
export function CourseCatalogCard({
  course,
  isAuthenticated,
  enrolled,
  onEnrolled,
  onStaleEnrollment,
}: CourseCatalogCardProps) {
  const [enrollState, setEnrollState] = useState<EnrollState>('idle');
  const [thumbnailError, setThumbnailError] = useState(false);

  const gradient = gradientForId(course.id);
  const showThumbnail = course.thumbnailUrl && !thumbnailError;

  async function handleEnroll() {
    setEnrollState('enrolling');
    try {
      await enrollInCourse(course.id);
      setEnrollState('idle');
      onEnrolled(course.id);
    } catch (error) {
      const status = getHttpStatus(error);
      if (status === 409) {
        // Stale local state, not an error: the learner is already enrolled.
        setEnrollState('idle');
        onEnrolled(course.id);
        onStaleEnrollment();
      } else if (status === 404) {
        setEnrollState('unavailable');
      } else if (status === 401 || status === 403) {
        setEnrollState('idle');
      } else {
        setEnrollState('failed');
      }
    }
  }

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
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary line-clamp-2 mb-2">
          {course.description}
        </p>
        <p className="text-caption text-text-secondary mb-3">
          {course.instructorName}
        </p>

        <div aria-live="polite">
          {!isAuthenticated ? (
            <Link
              to="/login"
              aria-label={`Sign in to enroll in ${course.title}`}
              className="inline-flex items-center min-h-[44px] text-caption font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
            >
              Sign in to enroll
            </Link>
          ) : enrolled ? (
            <div className="flex items-center justify-between gap-2">
              <Badge variant="salem">Enrolled</Badge>
              <Link
                to="/dashboard/courses"
                aria-label={`Continue ${course.title}`}
                className="inline-flex items-center gap-1 min-h-[44px] text-caption font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
              >
                Continue <span aria-hidden="true">→</span>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={enrollState === 'enrolling'}
                disabled={enrollState === 'unavailable'}
                aria-label={`Enroll in ${course.title}`}
                onClick={handleEnroll}
              >
                Enroll
              </Button>
              {enrollState === 'unavailable' && (
                <p className="text-caption text-text-secondary">
                  This course is no longer available.
                </p>
              )}
              {enrollState === 'failed' && (
                <p className="text-caption text-text-secondary">
                  Enrollment failed. Try again.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
