import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './axios';
import { uploadLearnerProfileImage } from './profile';

vi.mock('./axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

beforeEach(() => {
  vi.mocked(api.post).mockReset();
});

describe('uploadLearnerProfileImage', () => {
  it('posts a multipart FormData payload to the learner profile image endpoint', async () => {
    const file = new File(['fake-image-bytes'], 'avatar.jpg', { type: 'image/jpeg' });
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 1,
        userId: 1,
        displayName: 'Jane Doe',
        bio: null,
        profileImageUrl: 'https://res.cloudinary.com/demo/avatar.jpg',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    });

    const result = await uploadLearnerProfileImage(file);

    expect(api.post).toHaveBeenCalledWith('/api/v1/learner-profile/me/image', expect.any(FormData));
    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sentFormData.get('file')).toBe(file);
    expect(result.profileImageUrl).toBe('https://res.cloudinary.com/demo/avatar.jpg');
  });
});
