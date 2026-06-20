import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import { LEVEL_LABELS } from './courseLevelLabels';
import type { CourseCatalogItem } from '../../../api/courses';

interface CoursePreviewCardProps {
  course: CourseCatalogItem;
  onShowPreview?: (cardRect: DOMRect) => void;
  onHidePreview?: () => void;
}

/**
 * Presentational-only course card for discovery surfaces (landing page
 * previews). Shares tokens and the thumbnail/gradient fallback with
 * CourseCatalogCard, but has no enrollment action row: its job is to make a
 * visitor curious and route them to the detail page, not to transact. The
 * whole card is a single link (no nested interactive elements); hover/focus
 * report the card's own bounding rect so a parent slider can position a
 * supplemental detail panel beside it, outside its own overflow-x track.
 *
 * Title and description use a fixed two-line min-height (matches the 1.5
 * line-height multiplier shared by text-body-sm/text-caption, so 2 lines =
 * 3em) rather than relying on actual wrapped-line count — this is what keeps
 * every card in the slider the same height regardless of title/description
 * length.
 */
export function CoursePreviewCard({ course, onShowPreview, onHidePreview }: CoursePreviewCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false);

  const gradient = gradientForId(course.id);
  const showThumbnail = course.thumbnailUrl && !thumbnailError;

  return (
    <Link
      to={`/courses/${course.id}`}
      aria-label={`View course: ${course.title}`}
      onMouseEnter={(e) => onShowPreview?.(e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => onHidePreview?.()}
      onFocus={(e) => onShowPreview?.(e.currentTarget.getBoundingClientRect())}
      onBlur={() => onHidePreview?.()}
      className="flex flex-col h-full bg-surface border border-border-default rounded-lg overflow-hidden hover:border-border-hover motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
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

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          {course.categoryName && (
            <Badge variant="default">{course.categoryName}</Badge>
          )}
          <span className="text-caption text-text-muted">
            {LEVEL_LABELS[course.level] ?? course.level}
          </span>
        </div>

        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 mb-1 min-h-[3em]">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary line-clamp-2 mb-2 min-h-[3em]">
          {course.description}
        </p>
        <p className="text-caption text-text-secondary truncate mt-auto">
          {course.instructorName}
        </p>
      </div>
    </Link>
  );
}
