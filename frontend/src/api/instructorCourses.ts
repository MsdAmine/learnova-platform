import api from './axios';

// ── Types (mirror backend DTOs exactly) ───────────────────────────────────────

export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';

export interface InstructorCourseResponse {
  id: number;
  title: string;
  description: string | null;
  level: CourseLevel;
  status: CourseStatus;
  thumbnailUrl: string | null;
  categoryId: number;
  categoryName: string;
  instructorProfileId: number;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

// Mirrors CourseRequest — title, categoryId, level required; others optional.
export interface CreateInstructorCoursePayload {
  title: string;
  description?: string;
  categoryId: number;
  level: CourseLevel;
  thumbnailUrl?: string;
}

// Mirrors CourseUpdateRequest — all fields optional (partial patch).
export interface UpdateInstructorCoursePayload {
  title?: string;
  description?: string;
  categoryId?: number;
  level?: CourseLevel;
  thumbnailUrl?: string;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function getMyInstructorCourses(): Promise<InstructorCourseResponse[]> {
  const { data } = await api.get<InstructorCourseResponse[]>('/api/v1/instructor/courses');
  return data;
}

export async function createInstructorCourse(
  payload: CreateInstructorCoursePayload,
): Promise<InstructorCourseResponse> {
  const { data } = await api.post<InstructorCourseResponse>('/api/v1/instructor/courses', payload);
  return data;
}

export async function updateInstructorCourse(
  courseId: number,
  payload: UpdateInstructorCoursePayload,
): Promise<InstructorCourseResponse> {
  const { data } = await api.patch<InstructorCourseResponse>(
    `/api/v1/instructor/courses/${courseId}`,
    payload,
  );
  return data;
}

export async function publishInstructorCourse(courseId: number): Promise<InstructorCourseResponse> {
  const { data } = await api.post<InstructorCourseResponse>(
    `/api/v1/instructor/courses/${courseId}/publish`,
  );
  return data;
}

export async function archiveInstructorCourse(courseId: number): Promise<InstructorCourseResponse> {
  const { data } = await api.post<InstructorCourseResponse>(
    `/api/v1/instructor/courses/${courseId}/archive`,
  );
  return data;
}

export async function uploadCourseThumbnail(
  courseId: number,
  file: File,
): Promise<InstructorCourseResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<InstructorCourseResponse>(
    `/api/v1/instructor/courses/${courseId}/thumbnail`,
    formData,
  );
  return data;
}
