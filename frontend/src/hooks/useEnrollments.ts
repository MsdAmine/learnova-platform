import { useCallback, useEffect, useState } from 'react';
import { getMyEnrollments, type EnrollmentResponse } from '../api/enrollments';

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
 */
export function useEnrollments(): UseEnrollmentsResult {
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  // Initial state already represents the first load, so the mount effect never
  // needs to call setState synchronously.
  const [loading, setLoading] = useState(true);
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
    const token = { cancelled: false };
    fetchEnrollments(token);
    return () => {
      token.cancelled = true;
    };
  }, [fetchEnrollments]);

  // reload runs from an event handler (e.g. "Try again"), so resetting the
  // loading/error flags here is safe and not a synchronous effect update.
  const reload = useCallback(() => {
    setLoading(true);
    setError(false);
    fetchEnrollments({ cancelled: false });
  }, [fetchEnrollments]);

  return { enrollments, loading, error, reload };
}
