import { useCallback, useEffect, useState } from 'react';
import { getMyEnrollments, type EnrollmentResponse } from '../api/enrollments';
import { useAuth } from '../context/AuthContext';

interface UseEnrollmentsResult {
  enrollments: EnrollmentResponse[];
  loading: boolean;
  error: boolean;
  reload: () => void;
}

/**
 * Fetches the current learner's enrollments from
 * `GET /api/v1/learner/enrollments`.
 *
 * Auth failures (401/403) are handled globally by the shared Axios interceptor,
 * so this hook only surfaces a calm, page-local `error` flag for other failures.
 * `reload` re-runs the request for "Try again" affordances.
 *
 * Users without ROLE_LEARNER (e.g. admin-only users seeded without registration)
 * skip the fetch entirely. The backend would return 404 "Learner profile not found"
 * for such users; skipping the call returns a calm empty state instead of an error.
 */
export function useEnrollments(): UseEnrollmentsResult {
  const { user } = useAuth();
  const isLearner = user?.roles.includes('ROLE_LEARNER') ?? false;

  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  // Start in loading state only when we know a fetch will happen. user is loaded
  // synchronously from localStorage, so isLearner is stable on first render.
  const [loading, setLoading] = useState(isLearner);
  const [error, setError] = useState(false);

  const fetchEnrollments = useCallback((token: { cancelled: boolean }) => {
    getMyEnrollments()
      .then((data) => {
        if (!token.cancelled) setEnrollments(data);
      })
      .catch(() => {
        if (!token.cancelled) setError(true);
      })
      .finally(() => {
        if (!token.cancelled) setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isLearner) return;
    const token = { cancelled: false };
    fetchEnrollments(token);
    return () => {
      token.cancelled = true;
    };
  }, [isLearner, fetchEnrollments]);

  // reload runs from an event handler (e.g. "Try again"), so resetting the
  // loading/error flags here is safe and not a synchronous effect update.
  const reload = useCallback(() => {
    if (!isLearner) return;
    setLoading(true);
    setError(false);
    fetchEnrollments({ cancelled: false });
  }, [isLearner, fetchEnrollments]);

  return { enrollments, loading, error, reload };
}
