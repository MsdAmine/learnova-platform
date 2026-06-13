import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';
import { courseGradient } from './courseCardUtils';
import type { Course } from './courseCardUtils';

export type { Course };

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
        <span className="text-caption text-text-secondary">Not started</span>
        <Link
          to={`/dashboard/courses/${course.id}`}
          aria-label={`Start ${course.title}`}
          className="flex items-center gap-1 text-caption font-medium text-salem min-h-[44px] px-1 rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
        >
          Start <ArrowRight size={11} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function InProgressCourseCard({ course }: { course: Course }) {
  return (
    <Link
      to={`/dashboard/courses/${course.id}`}
      aria-label={`Continue ${course.title}`}
      className="block bg-surface border border-border-default rounded-lg overflow-hidden motion-safe:transition-shadow duration-standard hover:shadow-hover-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
    >
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
        <p className="text-caption text-text-secondary mt-1.5">{course.progress}% complete</p>
      </div>
    </Link>
  );
}

export function CourseCard({ course }: { course: Course }) {
  if (course.progress === 100) return <CompletedCourseCard course={course} />;
  if (course.progress === 0)   return <NotStartedCourseCard course={course} />;
  return <InProgressCourseCard course={course} />;
}
