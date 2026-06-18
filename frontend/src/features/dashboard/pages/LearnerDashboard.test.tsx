import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LearnerDashboard from './LearnerDashboard';
import { getMyCertificates } from '../../../api/certificates';
import type { CertificateResponse } from '../../../api/certificates';

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, fullName: 'Demo Learner', email: 'demo@learnova.dev', roles: ['ROLE_LEARNER'] },
  }),
}));

vi.mock('../../../hooks/useEnrollments', () => ({
  useEnrollments: () => ({ enrollments: [], loading: false, error: false, reload: vi.fn() }),
}));

vi.mock('../../../api/certificates', () => ({
  getMyCertificates: vi.fn(),
}));

function renderDashboard() {
  return render(
    <MemoryRouter>
      <LearnerDashboard />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.mocked(getMyCertificates).mockReset();
});

describe('LearnerDashboard certificates section', () => {
  it('shows a loading skeleton, not fake certificate data, while the request is pending', () => {
    vi.mocked(getMyCertificates).mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByText('Certificates')).toBeInTheDocument();
    expect(screen.queryByText('No certificates yet')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /issued/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no certificates', async () => {
    vi.mocked(getMyCertificates).mockResolvedValue([]);

    renderDashboard();

    expect(await screen.findByText('No certificates yet')).toBeInTheDocument();
  });

  it('renders a certificate link and no Download action when certificates exist', async () => {
    const certificates: CertificateResponse[] = [
      {
        id: 42,
        certificateCode: 'CERT-42',
        courseId: 7,
        courseTitle: 'Intro to Spring Boot',
        instructorName: 'Jane Doe',
        learnerName: 'Demo Learner',
        issuedAt: '2026-01-15T00:00:00Z',
      },
    ];
    vi.mocked(getMyCertificates).mockResolvedValue(certificates);

    renderDashboard();

    const link = await screen.findByRole('link', { name: /Intro to Spring Boot/i });
    expect(link).toHaveAttribute('href', '/dashboard/certificates/42');
    expect(screen.queryByText(/download/i)).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getMyCertificates).toHaveBeenCalledTimes(1);
    });
  });
});
