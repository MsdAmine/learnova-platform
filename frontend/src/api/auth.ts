import api from './axios';
import type { ProfileType } from '../types/profile';

interface User {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
  availableProfiles: ProfileType[];
  instructorApprovalStatus: string | null;
  learnerOnboardingCompleted: boolean | null;
}

export interface LoginResult {
  token: string;
  user: User;
}

export async function registerUser(fullName: string, email: string, password: string): Promise<LoginResult> {
  await api.post('/api/v1/auth/register', { fullName, email, password });
  return loginUser(email, password);
}

export async function loginUser(email: string, password: string): Promise<LoginResult> {
  const { data: auth } = await api.post<{ accessToken: string }>(
    '/api/v1/auth/login',
    { email, password },
  );

  // /me requires the token — not yet in localStorage, so pass it explicitly.
  const { data: me } = await api.get<User>('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  });

  return { token: auth.accessToken, user: me };
}
