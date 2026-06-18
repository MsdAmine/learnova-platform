import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { CourseCard, CourseThumb, CourseProgressFooter } from '../../../components/dashboard/CourseCard';
import { FeaturedCourseRow } from '../../../components/dashboard/FeaturedCourseRow';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { FilterTabs } from '../../../components/ui/FilterTabs';
import { Bone } from '../../../components/common/skeletons/Bone';
import { useEnrollments } from '../../../hooks/useEnrollments';
import { enrollmentToCourse } from '../../../api/enrollments';
import { getMyCertificates } from '../../../api/certificates';
import type { CertificateResponse } from '../../../api/certificates';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterValue = 'all' | 'in-progress' | 'completed';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatIssuedAt(isoString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoString));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LearnerDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FilterValue>('all');
  const { enrollments, loading, error, reload } = useEnrollments();

  const [certificates, setCertificates] = useState<CertificateResponse[]>([]);
  const [certsLoading, setCertsLoading] = useState(true);
  const [certsError, setCertsError] = useState(false);

  const fetchCertificates = useCallback((token: { cancelled: boolean }) => {
    getMyCertificates()
      .then(data => {
        if (token.cancelled) return;
        setCertificates(data);
      })
      .catch(() => {
        if (token.cancelled) return;
        setCertsError(true);
      })
      .finally(() => {
        if (token.cancelled) return;
        setCertsLoading(false);
      });
  }, []);

  useEffect(() => {
    const token = { cancelled: false };
    fetchCertificates(token);
    return () => { token.cancelled = true; };
  }, [fetchCertificates]);

  const handleCertsRetry = useCallback(() => {
    setCertsLoading(true);
    setCertsError(false);
    fetchCertificates({ cancelled: false });
  }, [fetchCertificates]);

  const firstName = user?.fullName?.split(' ')[0] ?? 'there';

  const courses = useMemo(() => enrollments.map(enrollmentToCourse), [enrollments]);

  const inProgressCount = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const completedCount = courses.filter(c => c.progress === 100).length;

  // "Continue Learning" surfaces the in-progress course with the highest
  // progress. Pure derivation — no hardcoded id.
  const continueCourse = useMemo(
    () =>
      courses
        .filter(c => c.progress > 0 && c.progress < 100)
        .sort((a, b) => b.progress - a.progress)[0] ?? null,
    [courses],
  );

  const filteredCourses = courses.filter(c => {
    if (filter === 'in-progress') return c.progress > 0 && c.progress < 100;
    if (filter === 'completed')   return c.progress === 100;
    return true;
  });

  // Feature the first in-progress course as a "Next up" row, then drop it from
  // the grid (distinct from the Continue Learning card above).
  const nextUpCourse = filteredCourses.find(c => c.progress > 0 && c.progress < 100);
  const gridCourses = nextUpCourse
    ? filteredCourses.filter(c => c.id !== nextUpCourse.id)
    : filteredCourses;

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* 1. Page header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Dashboard</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Welcome back, {firstName}
        </p>
      </div>

      {/* 2. Summary strip — derived counts only ───────────────────────── */}
      {!loading && !error && courses.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-0 mb-8 text-body-sm text-text-secondary"
          aria-label="Learning statistics"
        >
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{courses.length}</span>
            courses enrolled
          </span>
          <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{inProgressCount}</span>
            in progress
          </span>
          <span className="mx-3 text-border-hover select-none" aria-hidden="true">·</span>
          <span className="flex items-center">
            <span className="font-semibold text-text-primary mr-1.5">{completedCount}</span>
            completed
          </span>
        </div>
      )}

      {/* 3. Continue Learning ─────────────────────────────────────────── */}
      {loading ? (
        <section className="mb-8" aria-hidden="true">
          <Bone className="h-5 w-40 mb-4" />
          <Bone className="h-44 w-full rounded-lg" />
        </section>
      ) : continueCourse ? (
        <section aria-labelledby="continue-heading" className="mb-8">
          <h2
            id="continue-heading"
            className="text-title-sm font-semibold text-text-primary mb-4"
          >
            Continue Learning
          </h2>

          <div className="bg-surface border border-accent-border rounded-lg overflow-hidden">
            <div className="flex">
              <CourseThumb
                course={continueCourse}
                className="w-[240px] flex-shrink-0 hidden sm:block"
              />

              {/* Content */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-title-sm font-semibold text-text-primary mb-1 max-w-[48ch]">
                    {continueCourse.title}
                  </h3>
                  <p className="text-body-sm text-text-secondary">
                    by {continueCourse.instructor}
                  </p>
                </div>

                <div className="mt-5">
                  <CourseProgressFooter course={continueCourse} />
                  <div className="mt-4">
                    <Button variant="primary" size="md" asChild>
                      <Link to={`/dashboard/courses/${continueCourse.id}`}>Continue</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* 4. My Courses ────────────────────────────────────────────────── */}
      <section aria-labelledby="courses-heading" className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-4">
          <h2
            id="courses-heading"
            className="text-title-sm font-semibold text-text-primary"
          >
            My Courses
          </h2>

          {!loading && !error && courses.length > 0 && (
            <FilterTabs
              options={[
                { value: 'all',         label: 'All'         },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'completed',   label: 'Completed'   },
              ]}
              value={filter}
              onChange={(v) => setFilter(v)}
              aria-label="Filter courses"
            />
          )}
        </div>

        {loading ? (
          <div aria-hidden="true" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-lg overflow-hidden border border-border-default bg-surface">
                <Bone className="aspect-video w-full rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <Bone className="h-4 w-3/4" />
                  <Bone className="h-3 w-1/2" />
                  <Bone className="h-1 w-full rounded-full mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <StatePanel message="We could not load your enrollments." onRetry={reload} />
        ) : courses.length === 0 ? (
          <StatePanel message="You are not enrolled in any courses yet." />
        ) : filteredCourses.length === 0 ? (
          <p className="text-body-sm text-text-muted py-10 text-center">
            No courses match this filter.
          </p>
        ) : (
          <>
            {nextUpCourse && <FeaturedCourseRow course={nextUpCourse} />}

            {gridCourses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
                {gridCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* 5. Certificates ──────────────────────────────────────────────── */}
      <section aria-labelledby="certs-heading">
        <h2
          id="certs-heading"
          className="text-title-sm font-semibold text-text-primary mb-4"
        >
          Certificates
        </h2>

        {certsLoading ? (
          <div aria-hidden="true" className="flex flex-col sm:flex-row gap-4">
            {[0, 1].map(i => (
              <div key={i} className="flex items-center gap-4 bg-surface border border-border-default rounded-lg p-4 flex-1 min-w-0">
                <Bone className="w-9 h-9 rounded-md flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <Bone className="h-4 w-3/4 mb-2" />
                  <Bone className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : certsError ? (
          <StatePanel
            message="We could not load your certificates."
            onRetry={handleCertsRetry}
          />
        ) : certificates.length === 0 ? (
          <StatePanel
            title="No certificates yet"
            message="Complete a course to earn your first certificate."
          />
        ) : (
          <div className="flex flex-col sm:flex-row gap-4">
            {certificates.map(cert => (
              <Link
                key={cert.id}
                to={`/dashboard/certificates/${cert.id}`}
                className="flex items-center gap-4 bg-surface border border-border-default rounded-lg p-4 flex-1 min-w-0 hover:border-border-hover motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 bg-anzac-50"
                  aria-hidden="true"
                >
                  <Award
                    size={18}
                    className="text-anzac"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-text-primary truncate">
                    {cert.courseTitle}
                  </p>
                  <p className="text-caption text-text-muted mt-0.5">
                    Issued {formatIssuedAt(cert.issuedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
