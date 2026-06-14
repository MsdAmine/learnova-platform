import api from './axios';

// ── Types (mirror backend DTOs exactly) ───────────────────────────────────────

export type InstructorLessonResponse = {
  id: number;
  title: string;
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
export type LessonTitlePayload = { title: string };

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
  payload: LessonTitlePayload,
): Promise<InstructorLessonResponse> {
  const { data } = await api.post<InstructorLessonResponse>(
    `/api/v1/instructor/courses/sections/${sectionId}/lessons`,
    payload,
  );
  return data;
}

export async function updateLesson(
  lessonId: number,
  payload: LessonTitlePayload,
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
