import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import {
  getMyInstructorProfile,
  getMyLearnerProfile,
  updateMyInstructorProfile,
  uploadLearnerProfileImage,
} from '../../../api/profile';
import type { InstructorProfileResponse, LearnerProfileResponse } from '../../../api/profile';

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock('../../../context/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

const LEARNER_AUTH = {
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
};

vi.mock('../../../hooks/useCurrentUser', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../../../api/profile', async () => {
  const actual = await vi.importActual<typeof import('../../../api/profile')>('../../../api/profile');
  return {
    ...actual,
    getMyLearnerProfile: vi.fn(),
    getMyInstructorProfile: vi.fn(),
    updateMyInstructorProfile: vi.fn(),
    uploadLearnerProfileImage: vi.fn(),
  };
});

const PROFILE: LearnerProfileResponse = {
  id: 1,
  userId: 1,
  displayName: 'Jane Doe',
  bio: null,
  profileImageUrl: null,
  onboardingCompleted: true,
  onboardingCompletedAt: '2026-01-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const INSTRUCTOR_PROFILE: InstructorProfileResponse = {
  id: 2,
  userId: 1,
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  bio: 'Current instructor bio',
  expertise: 'React',
  experience: 'Five years teaching',
  motivation: 'Help learners grow',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  requestedAt: '2026-01-01T00:00:00Z',
  reviewedAt: '2026-01-02T00:00:00Z',
};

beforeEach(() => {
  mockUseAuth.mockReset();
  mockUseAuth.mockReturnValue(LEARNER_AUTH);
  vi.mocked(getMyLearnerProfile).mockReset();
  vi.mocked(getMyInstructorProfile).mockReset();
  vi.mocked(updateMyInstructorProfile).mockReset();
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

describe('SettingsPage instructor profile editing', () => {
  it('preserves the draft buffer across cancel, failure, save, and reopen', async () => {
    mockUseAuth.mockReturnValue({
      ...LEARNER_AUTH,
      user: {
        ...LEARNER_AUTH.user,
        roles: ['ROLE_LEARNER', 'ROLE_INSTRUCTOR'],
        availableProfiles: ['LEARNER', 'INSTRUCTOR'],
        instructorApprovalStatus: 'APPROVED',
      },
    });
    vi.mocked(getMyInstructorProfile).mockResolvedValue(INSTRUCTOR_PROFILE);
    const updatedProfile = {
      ...INSTRUCTOR_PROFILE,
      bio: 'Saved instructor bio',
      expertise: 'React and TypeScript',
    };
    vi.mocked(updateMyInstructorProfile)
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce(updatedProfile);

    render(<MemoryRouter><SettingsPage /></MemoryRouter>);

    // Settings is a sectioned shell: activate the Instructor section first.
    fireEvent.click(screen.getByRole('button', { name: 'Instructor' }));

    expect(await screen.findByText('Current instructor bio')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit instructor profile' }));
    expect(screen.getByLabelText('Bio *')).toHaveValue('Current instructor bio');
    expect(screen.getByLabelText('Expertise *')).toHaveValue('React');
    expect(screen.getByLabelText('Experience')).toHaveValue('Five years teaching');
    expect(screen.getByLabelText('Motivation')).toHaveValue('Help learners grow');

    fireEvent.change(screen.getByLabelText('Bio *'), { target: { value: 'Discarded draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel instructor profile edits' }));
    expect(screen.getByText('Current instructor bio')).toBeInTheDocument();
    expect(screen.queryByText('Discarded draft')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit instructor profile' }));
    expect(screen.getByLabelText('Bio *')).toHaveValue('Current instructor bio');
    fireEvent.change(screen.getByLabelText('Bio *'), { target: { value: 'Saved instructor bio' } });
    fireEvent.change(screen.getByLabelText('Expertise *'), {
      target: { value: 'React and TypeScript' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save instructor profile changes' }));

    expect(
      await screen.findByText('We could not save your instructor profile. Please try again.'),
    ).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Bio *')).toHaveValue('Saved instructor bio');
    expect(screen.getByLabelText('Expertise *')).toHaveValue('React and TypeScript');

    fireEvent.click(screen.getByRole('button', { name: 'Save instructor profile changes' }));
    await waitFor(() => expect(screen.getByText('Saved instructor bio')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Edit instructor profile' }));
    expect(screen.getByLabelText('Bio *')).toHaveValue('Saved instructor bio');
    expect(screen.getByLabelText('Expertise *')).toHaveValue('React and TypeScript');
  });
});
