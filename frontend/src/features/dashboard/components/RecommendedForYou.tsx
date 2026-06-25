import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { StatePanel } from '../../../components/dashboard/StatePanel';
import { Bone } from '../../../components/common/skeletons/Bone';
import { getCourseSuggestions } from '../../../api/courseSuggestions';
import type { CourseSuggestionsResponse } from '../../../api/courseSuggestions';
import { SuggestedCourseCard } from './SuggestedCourseCard';

// Dashboard shows a tasteful handful; the API may return more (default cap 8).
const MAX_DISPLAYED = 6;

type Status = 'loading' | 'error' | 'ready';

/**
 * "Recommended for you" — a calm dashboard section that surfaces rules-based
 * course suggestions from the learner's saved preferences. It fetches
 * independently of the enrollments/certificates sections, so a failure here
 * never blocks the rest of the dashboard. Honest by construction: it explains
 * its basis ("Based on your selected interests"), falls back transparently to
 * recently-added courses, and never fabricates personalization.
 */
export function RecommendedForYou() {
  const { user } = useAuth();
  const isLearner = user?.roles?.includes('ROLE_LEARNER') ?? false;

  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<CourseSuggestionsResponse | null>(null);

  // Loading is the default state, so the mount fetch never sets state
  // synchronously; only the async result (or the retry handler) does.
  const fetchSuggestions = useCallback((token: { cancelled: boolean }) => {
    getCourseSuggestions()
      .then(response => {
        if (token.cancelled) return;
        setData(response);
        setStatus('ready');
      })
      .catch(() => {
        if (token.cancelled) return;
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    if (!isLearner) return;
    const token = { cancelled: false };
    fetchSuggestions(token);
    return () => {
      token.cancelled = true;
    };
  }, [isLearner, fetchSuggestions]);

  const handleRetry = useCallback(() => {
    setStatus('loading');
    fetchSuggestions({ cancelled: false });
  }, [fetchSuggestions]);

  // The endpoint is LEARNER-only; never render (or call) it for non-learners.
  if (!isLearner) return null;

  const courses = data?.courses.slice(0, MAX_DISPLAYED) ?? [];
  const subtitle = data?.personalized
    ? 'Based on your selected interests'
    : 'Explore recently added courses';

  return (
    <section aria-labelledby="recommended-heading" className="mb-8">
      <div className="mb-4">
        <h2
          id="recommended-heading"
          className="text-title-sm font-semibold text-text-primary"
        >
          Recommended for you
        </h2>
        {status === 'ready' && courses.length > 0 && (
          <p className="text-body-sm text-text-secondary mt-1">{subtitle}</p>
        )}
      </div>

      {status === 'loading' ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="rounded-lg overflow-hidden border border-border-default bg-surface"
            >
              <Bone className="aspect-video w-full rounded-none" />
              <div className="p-4 flex flex-col gap-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
                <Bone className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <StatePanel
          message="We couldn't load your suggestions."
          onRetry={handleRetry}
        />
      ) : courses.length === 0 ? (
        <StatePanel
          title="No suggestions yet"
          message="Complete your learning preferences to get tailored suggestions."
          action={
            <Button variant="secondary" size="sm" asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {courses.map(course => (
            <SuggestedCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </section>
  );
}
