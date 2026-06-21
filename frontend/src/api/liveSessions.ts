import api from './axios';

// ── Types (mirror backend live-session DTOs exactly) ──────────────────────────
// Learner-facing responses never include meetingUrl/meetingRoomName — the
// meeting link is only ever returned by the join endpoint, after the backend
// has validated enrollment and session joinability.

export type LiveSessionStatus = 'SCHEDULED' | 'CANCELLED' | 'COMPLETED';
export type MeetingProvider = 'JITSI';

export interface LearnerLiveSessionResponse {
  id: number;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: LiveSessionStatus;
}

export interface JoinLiveSessionResponse {
  sessionId: number;
  title: string;
  startTime: string;
  endTime: string;
  meetingProvider: MeetingProvider;
  meetingUrl: string;
  meetingRoomName: string;
}

export interface InstructorLiveSessionResponse {
  id: number;
  courseId: number;
  courseTitle: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  meetingProvider: MeetingProvider;
  meetingUrl: string;
  meetingRoomName: string;
  maxParticipants: number | null;
  status: LiveSessionStatus;
  createdAt: string;
  updatedAt: string;
}

// Mirrors CreateLiveSessionRequest — title/startTime/endTime required.
export interface CreateLiveSessionPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  maxParticipants?: number;
}

// ── Learner API calls ───────────────────────────────────────────────────────

export async function listUpcomingLiveSessions(): Promise<LearnerLiveSessionResponse[]> {
  const { data } = await api.get<LearnerLiveSessionResponse[]>(
    '/api/v1/learner/live-sessions/upcoming',
  );
  return data;
}

export async function joinLiveSession(sessionId: number): Promise<JoinLiveSessionResponse> {
  const { data } = await api.post<JoinLiveSessionResponse>(
    `/api/v1/learner/live-sessions/${sessionId}/join`,
  );
  return data;
}

// ── Instructor API calls ────────────────────────────────────────────────────

export async function getMyInstructorLiveSessions(): Promise<InstructorLiveSessionResponse[]> {
  const { data } = await api.get<InstructorLiveSessionResponse[]>(
    '/api/v1/instructor/live-sessions',
  );
  return data;
}

export async function createInstructorLiveSession(
  courseId: number,
  payload: CreateLiveSessionPayload,
): Promise<InstructorLiveSessionResponse> {
  const { data } = await api.post<InstructorLiveSessionResponse>(
    `/api/v1/instructor/courses/${courseId}/live-sessions`,
    payload,
  );
  return data;
}

export async function cancelInstructorLiveSession(
  sessionId: number,
): Promise<InstructorLiveSessionResponse> {
  const { data } = await api.post<InstructorLiveSessionResponse>(
    `/api/v1/instructor/live-sessions/${sessionId}/cancel`,
  );
  return data;
}
