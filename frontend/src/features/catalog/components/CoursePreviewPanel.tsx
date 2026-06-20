import { Badge } from '../../../components/ui/Badge';
import { gradientForId } from '../../../components/dashboard/courseCardUtils';
import { LEVEL_LABELS } from './courseLevelLabels';
import type { CourseCatalogItem } from '../../../api/courses';

interface CoursePreviewPanelProps {
  course: CourseCatalogItem;
  side: 'left' | 'right';
}

/**
 * Supplemental detail popover shown on hover/focus of a CoursePreviewCard.
 * Purely visual — every field here already lives on the card or the detail
 * page it links to, so it is aria-hidden to avoid duplicate screen-reader
 * noise. Carries no interactive controls of its own (no nested links).
 *
 * `side` is which side of the hovered card the panel was placed on (decided
 * by the caller's viewport-edge check), so the notch can point back at the
 * card: a panel placed to the card's right grows an arrow on its own left
 * edge, and vice versa.
 */
export function CoursePreviewPanel({ course, side }: CoursePreviewPanelProps) {
  const gradient = gradientForId(course.id);

  return (
    <div
      aria-hidden="true"
      className="relative w-[400px] rounded-lg border border-border-default bg-surface shadow-layer overflow-hidden"
    >
      <span
        aria-hidden="true"
        className={`absolute top-7 h-4 w-4 rotate-45 border border-border-default bg-surface ${
          side === 'right'
            ? '-left-2 border-r-0 border-t-0'
            : '-right-2 border-l-0 border-b-0'
        }`}
      />

      <div
        aria-hidden="true"
        className="aspect-video w-full"
        style={
          course.thumbnailUrl
            ? { backgroundImage: `url(${course.thumbnailUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: `linear-gradient(140deg, ${gradient.from}, ${gradient.to})` }
        }
      />

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          {course.categoryName && <Badge variant="default">{course.categoryName}</Badge>}
          <span className="text-caption text-text-muted">
            {LEVEL_LABELS[course.level] ?? course.level}
          </span>
        </div>

        <h4 className="text-title-sm font-semibold text-text-primary line-clamp-2 mb-1.5">
          {course.title}
        </h4>

        <p className="text-caption text-text-secondary mb-3">{course.instructorName}</p>

        <p className="text-body-sm text-text-secondary line-clamp-4">{course.description}</p>
      </div>
    </div>
  );
}
