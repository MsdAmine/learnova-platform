import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProfileSwitch } from './useProfileSwitch';
import { switchActiveProfile } from '../api/profile';

const navigateMock = vi.fn();
const setActiveProfileMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ setActiveProfile: setActiveProfileMock }),
}));

vi.mock('../api/profile', () => ({
  switchActiveProfile: vi.fn(),
}));

beforeEach(() => {
  navigateMock.mockClear();
  setActiveProfileMock.mockClear();
  vi.mocked(switchActiveProfile).mockReset();
});

describe('useProfileSwitch', () => {
  it('updates the active profile and navigates to the instructor route on success', async () => {
    vi.mocked(switchActiveProfile).mockResolvedValue({
      activeProfile: 'INSTRUCTOR',
      availableProfiles: ['LEARNER', 'INSTRUCTOR'],
    });

    const { result } = renderHook(() => useProfileSwitch());

    await act(async () => {
      await result.current.switchTo('INSTRUCTOR');
    });

    expect(setActiveProfileMock).toHaveBeenCalledWith('INSTRUCTOR');
    expect(navigateMock).toHaveBeenCalledWith('/instructor/courses');
    expect(result.current.error).toBeNull();
    expect(result.current.switching).toBe(false);
  });

  it('exposes an error and does not navigate on failure', async () => {
    vi.mocked(switchActiveProfile).mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useProfileSwitch());

    await act(async () => {
      await result.current.switchTo('INSTRUCTOR');
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Could not switch profile. Please try again.');
    });
    expect(navigateMock).not.toHaveBeenCalled();
    expect(setActiveProfileMock).not.toHaveBeenCalled();
    expect(result.current.switching).toBe(false);
  });
});
