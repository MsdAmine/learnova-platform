import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import InstructorCoursesPage from './InstructorCoursesPage';
import { getMyInstructorCourses, uploadCourseThumbnail } from '../../../api/instructorCourses';
import { getCategories } from '../../../api/categories';
import type { InstructorCourseResponse } from '../../../api/instructorCourses';

vi.mock('../../../api/instructorCourses', async () => {
  const actual = await vi.importActual<typeof import('../../../api/instructorCourses')>(
    '../../../api/instructorCourses',
  );
  return {
    ...actual,
    getMyInstructorCourses: vi.fn(),
    uploadCourseThumbnail: vi.fn(),
  };
});

vi.mock('../../../api/categories', () => ({
  getCategories: vi.fn(),
}));

const COURSE: InstructorCourseResponse = {
  id: 7,
  title: 'React Fundamentals',
  description: 'Learn the basics.',
  level: 'BEGINNER',
  status: 'DRAFT',
  thumbnailUrl: null,
  categoryId: 1,
  categoryName: 'Web Development',
  instructorProfileId: 1,
  instructorName: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(getMyInstructorCourses).mockReset();
  vi.mocked(uploadCourseThumbnail).mockReset();
  vi.mocked(getCategories).mockReset();
  vi.mocked(getCategories).mockResolvedValue([
    { id: 1, name: 'Web Development', description: null, createdAt: '2026-01-01T00:00:00Z' },
  ]);
});

async function openEditModal() {
  vi.mocked(getMyInstructorCourses).mockResolvedValue([COURSE]);
  render(
    <MemoryRouter>
      <InstructorCoursesPage />
    </MemoryRouter>,
  );

  const editButton = await screen.findByRole('button', { name: 'Edit React Fundamentals' });
  fireEvent.click(editButton);

  expect(await screen.findByRole('button', { name: 'Upload thumbnail image' })).toBeInTheDocument();
}

describe('InstructorCoursesPage thumbnail upload', () => {
  it('uploads a thumbnail and shows the preview on success', async () => {
    vi.mocked(uploadCourseThumbnail).mockResolvedValue({
      ...COURSE,
      thumbnailUrl: 'https://res.cloudinary.com/demo/thumb.png',
    });

    await openEditModal();

    const fileInput = screen.getByLabelText('Choose course thumbnail image') as HTMLInputElement;
    const file = new File(['fake-image-bytes'], 'thumb.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadCourseThumbnail).toHaveBeenCalledWith(7, file);
    });

    const urlInput = await screen.findByDisplayValue('https://res.cloudinary.com/demo/thumb.png');
    expect(urlInput).toBeInTheDocument();
  });

  it('shows an inline accessible error when the upload fails', async () => {
    vi.mocked(uploadCourseThumbnail).mockRejectedValue(new Error('upload failed'));

    await openEditModal();

    const fileInput = screen.getByLabelText('Choose course thumbnail image') as HTMLInputElement;
    const file = new File(['fake-image-bytes'], 'thumb.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText('We could not upload this thumbnail. Please try again.'),
    ).toHaveAttribute('role', 'alert');
  });

  it('shows a client-side hint error for an oversized file without calling the API', async () => {
    await openEditModal();

    const fileInput = screen.getByLabelText('Choose course thumbnail image') as HTMLInputElement;
    const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [oversized] } });

    expect(await screen.findByText('Image must be 5MB or smaller.')).toHaveAttribute('role', 'alert');
    expect(uploadCourseThumbnail).not.toHaveBeenCalled();
  });
});
