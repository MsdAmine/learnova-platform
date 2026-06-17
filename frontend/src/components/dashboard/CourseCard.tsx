import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { courseGradient } from './courseCardUtils';
import type { Course } from './courseCardUtils';

export type { Course };

// Shared media block for any course-bearing card or row. A plain gradient
// fill, no icon overlay — keeps the thumbnail from reading as a separate
// design system across Continue Learning, the featured row, and the grid.
export function CourseThumb({ course, className }: { course: Course; className?: string }) {
  return (
    <div
      className={className}
      style={{ background: courseGradient(course) }}
      aria-hidden="true"
    />
  );
}

// Shared progress footer: bar, then percentage caption below — the pattern
// DESIGN.md specifies for course cards ("percentage text lives below, in
// Caption type"). No header label above the bar.
export function CourseProgressFooter({ course }: { course: Course }) {
  return (
    <div>
      <ProgressBar value={course.progress} label={`${course.title} progress`} />
      <p className="text-caption text-text-secondary mt-1.5">{course.progress}% complete</p>
    </div>
  );
}

const cardLinkClasses =
  'block bg-surface border border-border-default rounded-lg overflow-hidden motion-safe:transition-shadow duration-standard hover:shadow-hover-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem';

function CompletedCourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/dashboard/courses/${course.id}`}
      aria-label={`View ${course.title}`}
      className={cardLinkClasses}
    >
      <CourseThumb course={course} className="aspect-video w-full" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 flex-1">
            {course.title}
          </h3>
          <Badge variant="anzac" aria-label="Completed" className="gap-1 flex-shrink-0 mt-0.5">
            <Check size={10} aria-hidden="true" />
            Done
          </Badge>
        </div>
        <p className="text-caption text-text-secondary">{course.instructor}</p>
      </div>
    </Link>
  );
}

function NotStartedCourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/dashboard/courses/${course.id}`}
      aria-label={`Start ${course.title}`}
      className={cardLinkClasses}
    >
      <CourseThumb course={course} className="aspect-video w-full" />
      <div className="p-4">
        <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 mb-0.5">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
        <div className="flex items-center justify-between">
          <span className="text-caption text-text-secondary">Not started</span>
          <span className="flex items-center gap-1 text-caption font-medium text-salem">
            Start <ArrowRight size={11} aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function InProgressCourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/dashboard/courses/${course.id}`}
      aria-label={`Continue ${course.title}`}
      className={cardLinkClasses}
    >
      <CourseThumb course={course} className="aspect-video w-full" />
      <div className="p-4">
        <h3 className="text-body-sm font-semibold text-text-primary mb-0.5 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
        <CourseProgressFooter course={course} />
      </div>
    </Link>
  );
}

export function CourseCard({ course }: { course: Course }) {
  if (course.progress === 100) return <CompletedCourseCard course={course} />;
  if (course.progress === 0)   return <NotStartedCourseCard course={course} />;
  return <InProgressCourseCard course={course} />;
}
