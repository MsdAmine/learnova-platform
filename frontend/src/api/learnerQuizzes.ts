import api from './axios';

// ── Types (mirror backend learner-quiz DTOs exactly) ──────────────────────────
// Learner-facing options expose only { id, optionText } — never `isCorrect`.
// The submitted attempt result lives on `answerResults` (not `answers`).
// Score fields on QuizAttemptResponse are null while the attempt is IN_PROGRESS
// and populated on submission.

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type QuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED';

export interface LearnerQuizSummaryResponse {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  courseId: number;
  sectionId: number | null;
}

export interface LearnerAnswerOptionResponse {
  id: number;
  optionText: string;
}

export interface LearnerQuestionResponse {
  id: number;
  content: string;
  points: number;
  type: QuestionType;
  answerOptions: LearnerAnswerOptionResponse[];
}

export interface LearnerQuizDetailResponse {
  id: number;
  title: string;
  description: string | null;
  passingScore: number;
  courseId: number;
  sectionId: number | null;
  questions: LearnerQuestionResponse[];
}

export interface QuizAttemptAnswerResultResponse {
  questionId: number;
  selectedOptionId: number;
  correct: boolean;
  earnedPoints: number;
}

export interface QuizAttemptResponse {
  id: number;
  quizId: number;
  status: QuizAttemptStatus;
  earnedPoints: number | null;
  totalPoints: number | null;
  scorePercentage: number | null;
  passed: boolean | null;
  submittedAt: string | null;
  answerResults: QuizAttemptAnswerResultResponse[];
}

export interface QuizAttemptAnswerRequest {
  questionId: number;
  selectedOptionId: number;
}

export interface QuizAttemptSubmitRequest {
  answers: QuizAttemptAnswerRequest[];
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listLearnerCourseQuizzes(
  courseId: number,
): Promise<LearnerQuizSummaryResponse[]> {
  const { data } = await api.get<LearnerQuizSummaryResponse[]>(
    `/api/v1/learner/courses/${courseId}/quizzes`,
  );
  return data;
}

export async function getLearnerQuizDetail(
  quizId: number,
): Promise<LearnerQuizDetailResponse> {
  const { data } = await api.get<LearnerQuizDetailResponse>(
    `/api/v1/learner/quizzes/${quizId}`,
  );
  return data;
}

export async function startQuizAttempt(quizId: number): Promise<QuizAttemptResponse> {
  const { data } = await api.post<QuizAttemptResponse>(
    `/api/v1/learner/quizzes/${quizId}/attempts`,
  );
  return data;
}

export async function submitQuizAttempt(
  attemptId: number,
  payload: QuizAttemptSubmitRequest,
): Promise<QuizAttemptResponse> {
  const { data } = await api.post<QuizAttemptResponse>(
    `/api/v1/learner/quiz-attempts/${attemptId}/submit`,
    payload,
  );
  return data;
}

export async function getQuizAttempt(attemptId: number): Promise<QuizAttemptResponse> {
  const { data } = await api.get<QuizAttemptResponse>(
    `/api/v1/learner/quiz-attempts/${attemptId}`,
  );
  return data;
}
