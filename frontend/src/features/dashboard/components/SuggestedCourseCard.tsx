import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import type { CourseLevel } from '../../../api/courses';
import type { SuggestedCourse } from '../../../api/courseSuggestions';

const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};

/**
 * Discovery card for the dashboard "Recommended for you" section. Mirrors the
 * catalog card's visual language but is a pure discovery surface: the title
 * links to the public course detail page ({@code /courses/:courseId}) — no
 * enroll action lives here. Match reasons, when present, are rendered as quiet
 * supporting text; they are always backed by a real preference match from the
 * backend (never "best match" hype).
 */
export function SuggestedCourseCard({ course }: { course: SuggestedCourse }) {
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
            <Badge variant="accent">{course.categoryName}</Badge>
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
        <p className="text-caption text-text-secondary line-clamp-2 mb-2">
          {course.description}
        </p>
        <p className="text-caption text-text-secondary mb-3">
          {course.instructorName}
        </p>

        {course.matchReasons.length > 0 && (
          <ul className="flex flex-col gap-1">
            {course.matchReasons.map(reason => (
              <li key={reason} className="text-caption text-text-muted">
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
