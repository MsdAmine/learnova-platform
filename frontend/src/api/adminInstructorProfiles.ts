import api from './axios';

export type InstructorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type InstructorProfileReviewItem = {
  id: number;
  userId: number;
  fullName: string;
  email: string;
  bio: string;
  expertise: string;
  experience: string | null;
  motivation: string | null;
  approvalStatus: InstructorApprovalStatus;
  rejectionReason: string | null;
  requestedAt: string;
  reviewedAt: string | null;
};

export type RejectInstructorRequestPayload = {
  rejectionReason: string;
};

export async function getPendingInstructorProfiles(): Promise<InstructorProfileReviewItem[]> {
  const { data } = await api.get<InstructorProfileReviewItem[]>(
    '/api/v1/admin/instructor-profiles/pending',
  );
  return data;
}

export async function approveInstructorProfile(
  profileId: number,
): Promise<InstructorProfileReviewItem> {
  const { data } = await api.post<InstructorProfileReviewItem>(
    `/api/v1/admin/instructor-profiles/${profileId}/approve`,
  );
  return data;
}

export async function rejectInstructorProfile(
  profileId: number,
  payload: RejectInstructorRequestPayload,
): Promise<InstructorProfileReviewItem> {
  const { data } = await api.post<InstructorProfileReviewItem>(
    `/api/v1/admin/instructor-profiles/${profileId}/reject`,
    payload,
  );
  return data;
}
