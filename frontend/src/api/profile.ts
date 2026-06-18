import api from './axios';
import type { ProfileType, ProfileSwitchResponse } from '../types/profile';

export async function switchActiveProfile(profileType: ProfileType): Promise<ProfileSwitchResponse> {
  const { data } = await api.post<ProfileSwitchResponse>('/api/v1/profile/switch', { profileType });
  return data;
}

export interface LearnerProfileResponse {
  id: number;
  userId: number;
  displayName: string;
  bio: string | null;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LearnerProfileUpdatePayload {
  displayName: string;
  bio: string;
  profileImageUrl: string;
}

export interface InstructorProfileResponse {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  bio: string;
  expertise: string;
  experience: string | null;
  motivation: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
}

export interface InstructorProfileUpdatePayload {
  bio: string;
  expertise: string;
  experience: string;
  motivation: string;
}

export async function getMyLearnerProfile(): Promise<LearnerProfileResponse> {
  const { data } = await api.get<LearnerProfileResponse>('/api/v1/learner-profile/me');
  return data;
}

export async function updateMyLearnerProfile(
  payload: LearnerProfileUpdatePayload,
): Promise<LearnerProfileResponse> {
  const { data } = await api.patch<LearnerProfileResponse>('/api/v1/learner-profile/me', payload);
  return data;
}

export async function getMyInstructorProfile(): Promise<InstructorProfileResponse> {
  const { data } = await api.get<InstructorProfileResponse>('/api/v1/instructor-profile/me');
  return data;
}

export async function updateMyInstructorProfile(
  payload: InstructorProfileUpdatePayload,
): Promise<InstructorProfileResponse> {
  const { data } = await api.patch<InstructorProfileResponse>('/api/v1/instructor-profile/me', payload);
  return data;
}
