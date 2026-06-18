import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import {
  listQuizAttempts,
  getQuizAttempt,
  type QuizAttemptResponse,
} from './learnerQuizzes';

vi.mock('./axios', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.get).mockReset();
});

describe('listQuizAttempts', () => {
  it('calls the quiz attempt history endpoint for the given quiz', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await listQuizAttempts(99);

    expect(api.get).toHaveBeenCalledWith('/api/v1/learner/quizzes/99/attempts');
  });

  it('returns in-progress attempts without exposing correctness or scores', async () => {
    const inProgress: QuizAttemptResponse = {
      id: 1,
      quizId: 99,
      status: 'IN_PROGRESS',
      startedAt: '2026-01-01T00:00:00Z',
      earnedPoints: null,
      totalPoints: null,
      scorePercentage: null,
      passed: null,
      submittedAt: null,
      answerResults: [],
    };
    vi.mocked(api.get).mockResolvedValue({ data: [inProgress] });

    const attempts = await listQuizAttempts(99);

    expect(attempts).toHaveLength(1);
    expect(attempts[0].status).toBe('IN_PROGRESS');
    expect(attempts[0].answerResults).toEqual([]);
    expect(attempts[0].scorePercentage).toBeNull();
    expect(attempts[0].passed).toBeNull();
  });

  it('returns submitted attempts with score and pass state populated', async () => {
    const submitted: QuizAttemptResponse = {
      id: 2,
      quizId: 99,
      status: 'SUBMITTED',
      startedAt: '2026-01-01T00:00:00Z',
      earnedPoints: 8,
      totalPoints: 10,
      scorePercentage: 80,
      passed: true,
      submittedAt: '2026-01-01T00:05:00Z',
      answerResults: [
        { questionId: 1, selectedOptionId: 11, correct: true, earnedPoints: 8 },
      ],
    };
    vi.mocked(api.get).mockResolvedValue({ data: [submitted] });

    const attempts = await listQuizAttempts(99);

    expect(attempts[0].status).toBe('SUBMITTED');
    expect(attempts[0].scorePercentage).toBe(80);
    expect(attempts[0].passed).toBe(true);
    expect(attempts[0].answerResults[0].correct).toBe(true);
  });
});

describe('getQuizAttempt', () => {
  it('calls the single-attempt endpoint with the attempt id', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 5, quizId: 99, status: 'IN_PROGRESS' },
    });

    await getQuizAttempt(5);

    expect(api.get).toHaveBeenCalledWith('/api/v1/learner/quiz-attempts/5');
  });
});
