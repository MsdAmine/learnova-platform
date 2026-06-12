import api from './axios';
import { gradientForId, type Course } from '../components/dashboard/courseCardUtils';

// ── Types (mirror backend EnrollmentResponse DTO) ──────────────────────────────
// Backend record: id, courseId, courseTitle, instructorName, categoryName,
// status, progressPercentage, enrolledAt, completedAt. Instant → ISO string.

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface EnrollmentResponse {
  id: number;
  courseId: number;
  courseTitle: string;
  instructorName: string;
  categoryName: string | null;
  status: EnrollmentStatus;
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
}

// ── API calls (always via the shared Axios instance) ───────────────────────────

export async function getMyEnrollments(): Promise<EnrollmentResponse[]> {
  const { data } = await api.get<EnrollmentResponse[]>('/api/v1/learner/enrollments');
  return data;
}

export async function getMyEnrollmentByCourse(courseId: number): Promise<EnrollmentResponse> {
  const { data } = await api.get<EnrollmentResponse>(`/api/v1/learner/enrollments/${courseId}`);
  return data;
}

export async function enrollInCourse(courseId: number): Promise<EnrollmentResponse> {
  const { data } = await api.post<EnrollmentResponse>(`/api/v1/courses/${courseId}/enroll`);
  return data;
}

// ── Mapping to the dashboard Course model ──────────────────────────────────────
// The dashboard cards consume `Course` (id/title/instructor/progress/gradient).
// `progressPercentage` drives all card states (0 / 1-99 / 100), so it maps onto
// the existing CourseCard logic directly.

export function enrollmentToCourse(enrollment: EnrollmentResponse): Course {
  return {
    id: enrollment.courseId,
    title: enrollment.courseTitle,
    instructor: enrollment.instructorName,
    progress: enrollment.progressPercentage,
    gradient: gradientForId(enrollment.courseId),
  };
}
