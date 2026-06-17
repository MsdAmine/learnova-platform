import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CourseThumb, CourseProgressFooter, type Course } from './CourseCard';

export function FeaturedCourseRow({ course }: { course: Course }) {
  return (
    <Link
      to={`/dashboard/courses/${course.id}`}
      aria-label={`Continue ${course.title}`}
      className="block bg-surface border border-border-default rounded-lg overflow-hidden mb-4 motion-safe:transition-shadow duration-standard hover:shadow-hover-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
    >
      <div className="flex">
        <CourseThumb course={course} className="w-20 flex-shrink-0 hidden sm:block" />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <p className="text-caption text-text-muted mb-1">Next up</p>
              <h3 className="text-body-sm font-semibold text-text-primary line-clamp-1 mb-0.5">
                {course.title}
              </h3>
              <p className="text-caption text-text-secondary">{course.instructor}</p>
            </div>
            <span className="flex items-center gap-1 text-caption font-medium text-salem flex-shrink-0">
              Continue <ArrowRight size={11} aria-hidden="true" />
            </span>
          </div>
          <CourseProgressFooter course={course} />
        </div>
      </div>
    </Link>
  );
}
