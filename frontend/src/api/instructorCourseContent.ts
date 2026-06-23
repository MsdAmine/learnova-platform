import api from './axios';

// ── Types (mirror backend DTOs exactly) ───────────────────────────────────────

// Mirrors backend LessonContentType. TEXT carries body text; VIDEO/PDF/LINK carry
// an external http(s) URL. A lesson may have no content type yet (null).
export type LessonContentType = 'TEXT' | 'VIDEO' | 'PDF' | 'LINK';

export type InstructorLessonResponse = {
  id: number;
  title: string;
  contentType: LessonContentType | null;
  textContent: string | null;
  contentUrl: string | null;
  durationSeconds: number | null;
};

export type InstructorSectionResponse = {
  id: number;
  title: string;
  lessons: InstructorLessonResponse[];
};

export type InstructorCourseContentResponse = {
  courseId: number;
  courseTitle: string;
  sections: InstructorSectionResponse[];
};

export type SectionTitlePayload = { title: string };

// Lesson create/update payload. Content fields are optional; omit contentType
// (or send null) for a structural placeholder lesson with no body yet.
export type LessonPayload = {
  title: string;
  contentType?: LessonContentType | null;
  textContent?: string | null;
  contentUrl?: string | null;
  durationSeconds?: number | null;
};

// ── API functions ─────────────────────────────────────────────────────────────

export async function getInstructorCourseContent(
  courseId: number,
): Promise<InstructorCourseContentResponse> {
  const { data } = await api.get<InstructorCourseContentResponse>(
    `/api/v1/instructor/courses/${courseId}/content`,
  );
  return data;
}

export async function createSection(
  courseId: number,
  payload: SectionTitlePayload,
): Promise<InstructorSectionResponse> {
  const { data } = await api.post<InstructorSectionResponse>(
    `/api/v1/instructor/courses/${courseId}/sections`,
    payload,
  );
  return data;
}

export async function updateSection(
  sectionId: number,
  payload: SectionTitlePayload,
): Promise<InstructorSectionResponse> {
  const { data } = await api.patch<InstructorSectionResponse>(
    `/api/v1/instructor/courses/sections/${sectionId}`,
    payload,
  );
  return data;
}

export async function deleteSection(sectionId: number): Promise<void> {
  await api.delete(`/api/v1/instructor/courses/sections/${sectionId}`);
}

export async function createLesson(
  sectionId: number,
  payload: LessonPayload,
): Promise<InstructorLessonResponse> {
  const { data } = await api.post<InstructorLessonResponse>(
    `/api/v1/instructor/courses/sections/${sectionId}/lessons`,
    payload,
  );
  return data;
}

export async function updateLesson(
  lessonId: number,
  payload: LessonPayload,
): Promise<InstructorLessonResponse> {
  const { data } = await api.patch<InstructorLessonResponse>(
    `/api/v1/instructor/courses/lessons/${lessonId}`,
    payload,
  );
  return data;
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await api.delete(`/api/v1/instructor/courses/lessons/${lessonId}`);
}
