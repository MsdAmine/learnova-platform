import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { switchActiveProfile } from '../api/profile';
import { useAuth } from '../context/AuthContext';
import type { ProfileType } from '../types/profile';

const PROFILE_ROUTE: Record<ProfileType, string> = {
  LEARNER: '/dashboard',
  INSTRUCTOR: '/instructor/courses',
};

export function useProfileSwitch() {
  const { setActiveProfile } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchTo = useCallback(async (profileType: ProfileType) => {
    setSwitching(true);
    setError(null);
    try {
      const response = await switchActiveProfile(profileType);
      setActiveProfile(response.activeProfile);
      navigate(PROFILE_ROUTE[response.activeProfile]);
    } catch {
      setError('Could not switch profile. Please try again.');
    } finally {
      setSwitching(false);
    }
  }, [setActiveProfile, navigate]);

  return { switching, error, switchTo };
}
