import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LiveSessionsPage from './LiveSessionsPage';
import { listUpcomingLiveSessions, joinLiveSession } from '../../../api/liveSessions';
import type { LearnerLiveSessionResponse } from '../../../api/liveSessions';

vi.mock('../../../api/liveSessions', () => ({
  listUpcomingLiveSessions: vi.fn(),
  joinLiveSession: vi.fn(),
}));

const SESSION: LearnerLiveSessionResponse = {
  id: 1,
  courseId: 10,
  courseTitle: 'Advanced React',
  instructorName: 'Sarah Chen',
  title: 'Live Q&A',
  description: null,
  startTime: '2026-07-01T10:00:00Z',
  endTime: '2026-07-01T11:00:00Z',
  status: 'SCHEDULED',
};

beforeEach(() => {
  vi.mocked(listUpcomingLiveSessions).mockReset();
  vi.mocked(joinLiveSession).mockReset();
});

describe('LiveSessionsPage', () => {
  it('shows the honest empty state when there are no upcoming sessions', async () => {
    vi.mocked(listUpcomingLiveSessions).mockResolvedValue([]);

    render(<LiveSessionsPage />);

    expect(await screen.findByText('No live sessions scheduled')).toBeInTheDocument();
    expect(screen.queryByText(/meet\.learnova\.app/)).not.toBeInTheDocument();
  });

  it('shows an error state with a retry action when the fetch fails', async () => {
    vi.mocked(listUpcomingLiveSessions).mockRejectedValueOnce(new Error('network error'));

    render(<LiveSessionsPage />);

    expect(await screen.findByText('We could not load your live sessions.')).toBeInTheDocument();

    vi.mocked(listUpcomingLiveSessions).mockResolvedValueOnce([SESSION]);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Live Q&A')).toBeInTheDocument();
  });

  it('renders real upcoming sessions with no fake meeting or recording links', async () => {
    vi.mocked(listUpcomingLiveSessions).mockResolvedValue([SESSION]);

    render(<LiveSessionsPage />);

    expect(await screen.findByText('Live Q&A')).toBeInTheDocument();
    expect(screen.getByText('Advanced React · Sarah Chen')).toBeInTheDocument();
    expect(screen.queryByText(/recording/i)).not.toBeInTheDocument();
  });

  describe('joining a session', () => {
    const originalOpen = window.open;

    beforeEach(() => {
      window.open = vi.fn();
    });

    afterEach(() => {
      window.open = originalOpen;
    });

    it('calls the join API and opens the returned meeting URL in a new tab', async () => {
      vi.mocked(listUpcomingLiveSessions).mockResolvedValue([SESSION]);
      vi.mocked(joinLiveSession).mockResolvedValue({
        sessionId: 1,
        title: 'Live Q&A',
        startTime: SESSION.startTime,
        endTime: SESSION.endTime,
        meetingProvider: 'JITSI',
        meetingUrl: 'https://meet.jit.si/learnova-live-abc123',
        meetingRoomName: 'learnova-live-abc123',
      });

      render(<LiveSessionsPage />);

      const joinButton = await screen.findByRole('button', { name: 'Join live session: Live Q&A' });
      fireEvent.click(joinButton);

      await waitFor(() => {
        expect(joinLiveSession).toHaveBeenCalledWith(1);
      });
      expect(window.open).toHaveBeenCalledWith(
        'https://meet.jit.si/learnova-live-abc123',
        '_blank',
        'noopener,noreferrer',
      );
    });

    it('shows an inline error when joining fails', async () => {
      vi.mocked(listUpcomingLiveSessions).mockResolvedValue([SESSION]);
      vi.mocked(joinLiveSession).mockRejectedValue(new Error('join failed'));

      render(<LiveSessionsPage />);

      const joinButton = await screen.findByRole('button', { name: 'Join live session: Live Q&A' });
      fireEvent.click(joinButton);

      expect(await screen.findByText('We could not join this session. Try again.')).toBeInTheDocument();
      expect(window.open).not.toHaveBeenCalled();
    });
  });
});
