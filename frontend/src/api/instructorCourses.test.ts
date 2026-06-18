import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { uploadCourseThumbnail } from './instructorCourses';

vi.mock('./axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.post).mockReset();
});

describe('uploadCourseThumbnail', () => {
  it('posts a multipart FormData payload to the course-scoped thumbnail endpoint', async () => {
    const file = new File(['fake-image-bytes'], 'thumb.png', { type: 'image/png' });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 7,
        title: 'React Fundamentals',
        description: null,
        level: 'BEGINNER',
        status: 'DRAFT',
        thumbnailUrl: 'https://res.cloudinary.com/demo/thumb.png',
        categoryId: 1,
        categoryName: 'Web Development',
        instructorProfileId: 1,
        instructorName: 'Jane Doe',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    const result = await uploadCourseThumbnail(7, file);

    expect(api.post).toHaveBeenCalledWith(
      '/api/v1/instructor/courses/7/thumbnail',
      expect.any(FormData),
    );
    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sentFormData.get('file')).toBe(file);
    expect(result.thumbnailUrl).toBe('https://res.cloudinary.com/demo/thumb.png');
  });
});
