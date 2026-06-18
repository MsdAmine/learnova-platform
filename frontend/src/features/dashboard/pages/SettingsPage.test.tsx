import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { getMyLearnerProfile, uploadLearnerProfileImage } from '../../../api/profile';
import type { LearnerProfileResponse } from '../../../api/profile';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 1,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      roles: ['ROLE_LEARNER'],
      availableProfiles: ['LEARNER'],
      instructorApprovalStatus: null,
    },
    activeProfile: 'LEARNER',
    isAuthenticated: true,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../../../api/profile', async () => {
  const actual = await vi.importActual<typeof import('../../../api/profile')>('../../../api/profile');
  return {
    ...actual,
    getMyLearnerProfile: vi.fn(),
    uploadLearnerProfileImage: vi.fn(),
  };
});

const PROFILE: LearnerProfileResponse = {
  id: 1,
  userId: 1,
  displayName: 'Jane Doe',
  bio: null,
  profileImageUrl: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(getMyLearnerProfile).mockReset();
  vi.mocked(uploadLearnerProfileImage).mockReset();
  vi.mocked(getMyLearnerProfile).mockResolvedValue(PROFILE);
});

describe('SettingsPage learner profile image upload', () => {
  it('uploads a photo and updates the preview on success', async () => {
    vi.mocked(uploadLearnerProfileImage).mockResolvedValue({
      ...PROFILE,
      profileImageUrl: 'https://res.cloudinary.com/demo/avatar.jpg',
    });

    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    const fileInput = await screen.findByLabelText('Choose profile image');
    const file = new File(['fake-image-bytes'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadLearnerProfileImage).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(screen.getByText('https://res.cloudinary.com/demo/avatar.jpg')).toBeInTheDocument();
    });
  });

  it('shows an inline accessible error when the upload fails', async () => {
    vi.mocked(uploadLearnerProfileImage).mockRejectedValue(new Error('upload failed'));

    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    const fileInput = await screen.findByLabelText('Choose profile image');
    const file = new File(['fake-image-bytes'], 'avatar.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      await screen.findByText('We could not upload your photo. Please try again.'),
    ).toHaveAttribute('role', 'alert');
  });

  it('shows a client-side hint error for an unsupported file type without calling the API', async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    const fileInput = await screen.findByLabelText('Choose profile image');
    const file = new File(['not-an-image'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByText('Please choose a JPG, PNG, or WEBP image.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(uploadLearnerProfileImage).not.toHaveBeenCalled();
  });
});
