import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AttemptHistory, QuizCard } from './QuizCard';
import type { LearnerQuizSummaryResponse, QuizAttemptResponse } from '../../../../api/learnerQuizzes';

function inProgressAttempt(overrides: Partial<QuizAttemptResponse> = {}): QuizAttemptResponse {
  return {
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
    ...overrides,
  };
}

function submittedAttempt(overrides: Partial<QuizAttemptResponse> = {}): QuizAttemptResponse {
  return {
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
    ...overrides,
  };
}

const quiz: LearnerQuizSummaryResponse = {
  id: 99,
  title: 'Spring Boot Basics',
  description: null,
  passingScore: 70,
  courseId: 7,
  sectionId: null,
};

describe('AttemptHistory', () => {
  it('shows a calm empty state when there is no history', () => {
    render(
      <AttemptHistory
        quizTitle={quiz.title}
        attempts={[]}
        resuming={false}
        viewingAttemptId={null}
        onResume={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(screen.getByText('No attempts yet.')).toBeInTheDocument();
  });

  it('shows status and a Resume action for an in-progress attempt', () => {
    render(
      <AttemptHistory
        quizTitle={quiz.title}
        attempts={[inProgressAttempt()]}
        resuming={false}
        viewingAttemptId={null}
        onResume={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /resume attempt 1 of spring boot basics/i }),
    ).toBeInTheDocument();
  });

  it('shows score and pass state and a View result action for a submitted attempt', () => {
    render(
      <AttemptHistory
        quizTitle={quiz.title}
        attempts={[submittedAttempt()]}
        resuming={false}
        viewingAttemptId={null}
        onResume={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(screen.getByText('80% · Passed')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /view result for attempt 1 of spring boot basics/i }),
    ).toBeInTheDocument();
  });

  it('renders attempts in the order passed by props', () => {
    const older = submittedAttempt({ id: 10, submittedAt: '2026-01-01T00:05:00Z' });
    const newer = inProgressAttempt({ id: 11, startedAt: '2026-01-02T00:00:00Z' });

    render(
      <AttemptHistory
        quizTitle={quiz.title}
        attempts={[newer, older]}
        resuming={false}
        viewingAttemptId={null}
        onResume={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Attempt 2');
    expect(items[0]).toHaveTextContent('In progress');
    expect(items[1]).toHaveTextContent('Attempt 1');
    expect(items[1]).toHaveTextContent('80%');
  });

  it('does not render correctness or score details for an in-progress attempt', () => {
    render(
      <AttemptHistory
        quizTitle={quiz.title}
        attempts={[inProgressAttempt()]}
        resuming={false}
        viewingAttemptId={null}
        onResume={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(screen.queryByText(/passed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/correct/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe('QuizCard', () => {
  it('renders a Retake quiz action when the latest attempt is submitted', () => {
    render(
      <QuizCard
        quiz={quiz}
        attempts={[submittedAttempt()]}
        starting={false}
        viewingAttemptId={null}
        onStart={vi.fn()}
        onViewResult={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('button', { name: `Retake ${quiz.title}` }),
    ).toBeInTheDocument();
  });

  it('calls onStart when Retake quiz is clicked', () => {
    const onStart = vi.fn();

    render(
      <QuizCard
        quiz={quiz}
        attempts={[submittedAttempt()]}
        starting={false}
        viewingAttemptId={null}
        onStart={onStart}
        onViewResult={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: `Retake ${quiz.title}` }));

    expect(onStart).toHaveBeenCalledWith(quiz.id);
  });

  it('calls onViewResult when View result is clicked', () => {
    const onViewResult = vi.fn();
    const attempt = submittedAttempt();

    render(
      <QuizCard
        quiz={quiz}
        attempts={[attempt]}
        starting={false}
        viewingAttemptId={null}
        onStart={vi.fn()}
        onViewResult={onViewResult}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: `View result for ${quiz.title}` }));

    expect(onViewResult).toHaveBeenCalledWith(attempt.id);
  });
});
