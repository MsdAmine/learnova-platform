import api from './axios';

// ── Types (mirror backend DTOs exactly) ────────────────────────────────────────
// Content payload: LessonContentResponse uses `completed` (boolean, no `is` prefix).
// Progress request/response: uses `isCompleted`. Do not conflate the two.

// Mirrors backend LessonContentType. TEXT carries body text; VIDEO/PDF/LINK carry
// an external http(s) URL. A lesson may have no content type yet (null).
export type LessonContentType = 'TEXT' | 'VIDEO' | 'PDF' | 'LINK';

export type LessonContentResponse = {
  id: number;
  title: string;
  contentType: LessonContentType | null;
  textContent: string | null;
  contentUrl: string | null;
  durationSeconds: number | null;
  completed: boolean;
  lastPositionSeconds: number | null;
  timeSpentSeconds: number | null;
};

export type SectionContentResponse = {
  id: number;
  title: string;
  lessons: LessonContentResponse[];
};

export type CourseContentResponse = {
  courseId: number;
  courseTitle: string;
  sections: SectionContentResponse[];
};

export type LessonProgressResponse = {
  id: number;
  learnerProfileId: number;
  lessonId: number;
  isCompleted: boolean;
  lastPositionSeconds: number | null;
  timeSpentSeconds: number | null;
  updatedAt: string;
};

// ── API calls ─────────────────────────────────────────────────────────────────

export async function getLearnerCourseContent(
  courseId: number,
): Promise<CourseContentResponse> {
  const { data } = await api.get<CourseContentResponse>(
    `/api/v1/learner/courses/${courseId}/content`,
  );
  return data;
}

export async function updateLessonProgress(
  lessonId: number,
  payload: {
    isCompleted: boolean;
    lastPositionSeconds?: number;
    timeSpentSeconds?: number;
  },
): Promise<LessonProgressResponse> {
  const { data } = await api.patch<LessonProgressResponse>(
    `/api/v1/lessons/${lessonId}/progress`,
    payload,
  );
  return data;
}
