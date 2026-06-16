import api from './axios';

// ── Types (mirror backend DTOs exactly) ───────────────────────────────────────

export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export interface QuizResponse {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  status: QuizStatus;
  courseId: number;
  sectionId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerOptionResponse {
  id: number;
  optionText: string;
  isCorrect: boolean;
}

export interface QuestionResponse {
  id: number;
  content: string;
  points: number;
  type: QuestionType;
  answerOptions: AnswerOptionResponse[];
}

// The detail tree returned by GET /quizzes/{quizId}: quiz fields + questions.
export interface QuizDetailResponse extends QuizResponse {
  questions: QuestionResponse[];
}

// Request payloads (mirror backend DTOs exactly).
export interface QuizFormPayload {
  title: string;
  description?: string | null;
  passingScore: number;
  sectionId?: number | null;
}

export interface QuestionRequestPayload {
  content: string;
  points: number;
  type: QuestionType;
}

export interface AnswerOptionRequestPayload {
  optionText: string;
  isCorrect: boolean;
}

// ── API functions ─────────────────────────────────────────────────────────────

export async function listInstructorQuizzes(courseId: number): Promise<QuizResponse[]> {
  const { data } = await api.get<QuizResponse[]>(`/api/v1/instructor/courses/${courseId}/quizzes`);
  return data;
}

export async function getInstructorQuizDetail(quizId: number): Promise<QuizDetailResponse> {
  const { data } = await api.get<QuizDetailResponse>(`/api/v1/instructor/courses/quizzes/${quizId}`);
  return data;
}

export async function createInstructorQuiz(
  courseId: number,
  payload: QuizFormPayload,
): Promise<QuizResponse> {
  const { data } = await api.post<QuizResponse>(
    `/api/v1/instructor/courses/${courseId}/quizzes`,
    payload,
  );
  return data;
}

export async function updateInstructorQuiz(
  quizId: number,
  payload: QuizFormPayload,
): Promise<QuizResponse> {
  const { data } = await api.put<QuizResponse>(
    `/api/v1/instructor/courses/quizzes/${quizId}`,
    payload,
  );
  return data;
}

export async function publishInstructorQuiz(quizId: number): Promise<QuizResponse> {
  const { data } = await api.patch<QuizResponse>(
    `/api/v1/instructor/courses/quizzes/${quizId}/publish`,
  );
  return data;
}

export async function archiveInstructorQuiz(quizId: number): Promise<QuizResponse> {
  const { data } = await api.patch<QuizResponse>(
    `/api/v1/instructor/courses/quizzes/${quizId}/archive`,
  );
  return data;
}

export async function addQuestionToQuiz(
  quizId: number,
  payload: QuestionRequestPayload,
): Promise<QuestionResponse> {
  const { data } = await api.post<QuestionResponse>(
    `/api/v1/instructor/courses/quizzes/${quizId}/questions`,
    payload,
  );
  return data;
}

export async function updateQuestion(
  questionId: number,
  payload: QuestionRequestPayload,
): Promise<QuestionResponse> {
  const { data } = await api.put<QuestionResponse>(
    `/api/v1/instructor/courses/questions/${questionId}`,
    payload,
  );
  return data;
}

export async function deleteQuestion(questionId: number): Promise<void> {
  await api.delete(`/api/v1/instructor/courses/questions/${questionId}`);
}

export async function addAnswerOption(
  questionId: number,
  payload: AnswerOptionRequestPayload,
): Promise<AnswerOptionResponse> {
  const { data } = await api.post<AnswerOptionResponse>(
    `/api/v1/instructor/courses/questions/${questionId}/options`,
    payload,
  );
  return data;
}

export async function updateAnswerOption(
  optionId: number,
  payload: AnswerOptionRequestPayload,
): Promise<AnswerOptionResponse> {
  const { data } = await api.put<AnswerOptionResponse>(
    `/api/v1/instructor/courses/options/${optionId}`,
    payload,
  );
  return data;
}

export async function deleteAnswerOption(optionId: number): Promise<void> {
  await api.delete(`/api/v1/instructor/courses/options/${optionId}`);
}
