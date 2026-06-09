import { ArrowRight } from 'lucide-react';
import { cn } from '../../lib/cn';
import { ProgressBar } from '../ui/ProgressBar';
import { courseGradient, type Course } from './courseCardUtils';

export function FeaturedCourseRow({ course }: { course: Course }) {
  return (
    <div className="bg-surface border border-border-default rounded-lg overflow-hidden mb-4 motion-safe:transition-colors duration-fast hover:border-border-hover">
      <div className="flex">
        <div
          className="w-20 flex-shrink-0 hidden sm:block"
          style={{ background: courseGradient(course) }}
          aria-hidden="true"
        />
        <div className="flex-1 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-caption text-text-muted mb-1">Next up</p>
              <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
                {course.title}
              </h3>
              <p className="text-caption text-text-secondary">{course.instructor}</p>
            </div>
            <button
              type="button"
              aria-label={`Continue ${course.title}`}
              className={cn(
                'flex items-center gap-1 text-body-sm font-medium text-salem flex-shrink-0',
                'p-2 -m-2',
                'hover:text-salem-400 motion-safe:transition-colors duration-fast',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
              )}
            >
              Continue <ArrowRight size={13} aria-hidden="true" />
            </button>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-caption text-text-muted">Progress</span>
              <span className="text-caption font-medium text-text-secondary">
                {course.progress}% complete
              </span>
            </div>
            <ProgressBar value={course.progress} label={`${course.title} progress`} />
          </div>
        </div>
      </div>
    </div>
  );
}
