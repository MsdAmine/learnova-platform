import { Check, ArrowRight } from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';

export interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  gradient?: { from: string; to: string };
}

// Salem-ramp fallback so a course without an explicit gradient still renders a
// valid thumbnail. Centralizing this guards both the in-progress card (which
// otherwise crashes on `gradient.from`) and the featured row (which otherwise
// emits an invalid `linear-gradient(…, undefined, undefined)`).
const DEFAULT_GRADIENT = { from: '#032117', to: '#1A3B2E' } as const;

export function courseGradient(course: Course): string {
  const { from, to } = course.gradient ?? DEFAULT_GRADIENT;
  return `linear-gradient(140deg, ${from}, ${to})`;
}

function CompletedCourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
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
  );
}

function NotStartedCourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4 hover:border-border-hover motion-safe:transition-colors duration-fast">
      <h3 className="text-body-sm font-semibold text-text-primary line-clamp-2 mb-1">
        {course.title}
      </h3>
      <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
      <div className="flex items-center justify-between">
        <span className="text-caption text-text-muted">Not started</span>
        <button
          type="button"
          aria-label={`Start ${course.title}`}
          className="flex items-center gap-1 text-caption font-medium text-salem p-2 -m-2 hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
        >
          Start <ArrowRight size={11} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function InProgressCourseCard({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg overflow-hidden cursor-pointer motion-safe:transition-shadow duration-standard hover:shadow-hover-lift">
      <div
        className="aspect-video w-full"
        style={{ background: courseGradient(course) }}
        aria-hidden="true"
      />
      <div className="p-4">
        <h3 className="text-body-sm font-semibold text-text-primary mb-0.5 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-caption text-text-secondary mb-3">{course.instructor}</p>
        <ProgressBar value={course.progress} label={`${course.title} progress`} />
        <p className="text-caption text-text-muted mt-1.5">{course.progress}% complete</p>
      </div>
    </div>
  );
}

export function CourseCard({ course }: { course: Course }) {
  if (course.progress === 100) return <CompletedCourseCard course={course} />;
  if (course.progress === 0)   return <NotStartedCourseCard course={course} />;
  return <InProgressCourseCard course={course} />;
}
