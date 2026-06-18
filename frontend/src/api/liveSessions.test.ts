import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import {
  listUpcomingLiveSessions,
  joinLiveSession,
  getMyInstructorLiveSessions,
  createInstructorLiveSession,
  cancelInstructorLiveSession,
} from './liveSessions';

vi.mock('./axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
  vi.mocked(api.post).mockReset();
});

describe('listUpcomingLiveSessions', () => {
  it('calls the learner upcoming live-sessions endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await listUpcomingLiveSessions();

    expect(api.get).toHaveBeenCalledWith('/api/v1/learner/live-sessions/upcoming');
  });
});

describe('joinLiveSession', () => {
  it('calls the join endpoint for the given session id', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        sessionId: 5,
        title: 'Q&A',
        startTime: '2026-01-01T10:00:00Z',
        endTime: '2026-01-01T11:00:00Z',
        meetingProvider: 'JITSI',
        meetingUrl: 'https://meet.jit.si/learnova-live-abc123',
        meetingRoomName: 'learnova-live-abc123',
      },
    });

    const result = await joinLiveSession(5);

    expect(api.post).toHaveBeenCalledWith('/api/v1/learner/live-sessions/5/join');
    expect(result.meetingUrl).toBe('https://meet.jit.si/learnova-live-abc123');
  });
});

describe('getMyInstructorLiveSessions', () => {
  it('calls the instructor live-sessions list endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await getMyInstructorLiveSessions();

    expect(api.get).toHaveBeenCalledWith('/api/v1/instructor/live-sessions');
  });
});

describe('createInstructorLiveSession', () => {
  it('posts the payload to the course-scoped create endpoint', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await createInstructorLiveSession(7, {
      title: 'Live Q&A',
      startTime: '2026-01-01T10:00:00Z',
      endTime: '2026-01-01T11:00:00Z',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/api/v1/instructor/courses/7/live-sessions',
      { title: 'Live Q&A', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z' },
    );
  });
});

describe('cancelInstructorLiveSession', () => {
  it('calls the cancel endpoint for the given session id', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });

    await cancelInstructorLiveSession(9);

    expect(api.post).toHaveBeenCalledWith('/api/v1/instructor/live-sessions/9/cancel');
  });
});
