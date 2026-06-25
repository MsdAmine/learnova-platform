import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecommendedForYou } from './RecommendedForYou';
import { getCourseSuggestions } from '../../../api/courseSuggestions';
import type { CourseSuggestionsResponse, SuggestedCourse } from '../../../api/courseSuggestions';

let mockUser: { roles: string[] } | null = { roles: ['ROLE_LEARNER'] };

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('../../../api/courseSuggestions', () => ({
  getCourseSuggestions: vi.fn(),
}));

function suggestion(overrides: Partial<SuggestedCourse> = {}): SuggestedCourse {
  return {
    id: 1,
    title: 'Intro to Data Analytics',
    description: 'Learn the basics of data analytics.',
    categoryName: 'Data Analytics',
    level: 'BEGINNER',
    thumbnailUrl: null,
    instructorName: 'Ada Lovelace',
    createdAt: '2026-01-01T00:00:00Z',
    matchReasons: [],
    ...overrides,
  };
}

function renderSection() {
  return render(
    <MemoryRouter>
      <RecommendedForYou />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockUser = { roles: ['ROLE_LEARNER'] };
  vi.mocked(getCourseSuggestions).mockReset();
});

describe('RecommendedForYou', () => {
  it('shows a loading skeleton, not fake course data, while pending', () => {
    vi.mocked(getCourseSuggestions).mockReturnValue(new Promise(() => {}));

    renderSection();

    expect(screen.getByText('Recommended for you')).toBeInTheDocument();
    expect(screen.queryByText('No suggestions yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  it('renders personalized copy and a match reason when personalized suggestions exist', async () => {
    const response: CourseSuggestionsResponse = {
      personalized: true,
      reason: 'Based on your selected interests',
      courses: [suggestion({ matchReasons: ['Matches your interest in Data Analytics'] })],
    };
    vi.mocked(getCourseSuggestions).mockResolvedValue(response);

    renderSection();

    expect(await screen.findByText('Based on your selected interests')).toBeInTheDocument();
    expect(screen.getByText('Matches your interest in Data Analytics')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: 'Intro to Data Analytics' });
    expect(link).toHaveAttribute('href', '/courses/1');
  });

  it('renders the recently-added copy for a non-personalized fallback', async () => {
    const response: CourseSuggestionsResponse = {
      personalized: false,
      reason: 'Explore recently added courses',
      courses: [suggestion()],
    };
    vi.mocked(getCourseSuggestions).mockResolvedValue(response);

    renderSection();

    expect(await screen.findByText('Explore recently added courses')).toBeInTheDocument();
    expect(screen.queryByText('Based on your selected interests')).not.toBeInTheDocument();
  });

  it('shows an honest empty state with a Browse courses CTA when there are no suggestions', async () => {
    const response: CourseSuggestionsResponse = {
      personalized: false,
      reason: 'Complete your preferences to get tailored suggestions',
      courses: [],
    };
    vi.mocked(getCourseSuggestions).mockResolvedValue(response);

    renderSection();

    expect(await screen.findByText('No suggestions yet')).toBeInTheDocument();
    expect(
      screen.getByText('Complete your learning preferences to get tailored suggestions.'),
    ).toBeInTheDocument();
    const browse = screen.getByRole('link', { name: 'Browse courses' });
    expect(browse).toHaveAttribute('href', '/courses');
  });

  it('shows a non-blocking error state with retry when the fetch fails', async () => {
    vi.mocked(getCourseSuggestions).mockRejectedValue(new Error('boom'));

    renderSection();

    expect(await screen.findByText("We couldn't load your suggestions.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('displays at most six cards even when the API returns more', async () => {
    const courses = Array.from({ length: 8 }, (_, i) =>
      suggestion({ id: i + 1, title: `Course ${i + 1}` }),
    );
    vi.mocked(getCourseSuggestions).mockResolvedValue({
      personalized: true,
      reason: 'Based on your selected interests',
      courses,
    });

    renderSection();

    await screen.findByText('Course 1');
    expect(screen.getAllByRole('article')).toHaveLength(6);
  });

  it('renders nothing and does not call the API for a non-learner', () => {
    mockUser = { roles: ['ROLE_INSTRUCTOR'] };

    const { container } = renderSection();

    expect(container).toBeEmptyDOMElement();
    expect(getCourseSuggestions).not.toHaveBeenCalled();
  });
});
