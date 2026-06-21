import api from './axios';
import type { CourseLevel } from './courses';

// ── Types (mirror backend LearningPreferencesResponse / UpdateLearningPreferencesRequest) ──
// Intentionally a standalone module: Settings and a future onboarding flow both
// call getLearningPreferences/updateLearningPreferences directly, with no
// Settings-page-specific state baked into the client.

export type LearningGoal = 'CAREER_GROWTH' | 'SKILL_UP' | 'ACADEMIC' | 'HOBBY' | 'NOT_SURE';

// Reuses CourseLevel — ALL_LEVELS doubles as the "no preference" option.
export type PreferredLevel = CourseLevel;

export interface LearningPreferencesResponse {
  learningGoal: LearningGoal | null;
  preferredLevel: PreferredLevel | null;
  weeklyGoalMinutes: number | null;
  preferredCategoryIds: number[];
  updatedAt: string | null;
}

export interface UpdateLearningPreferencesPayload {
  learningGoal: LearningGoal | null;
  preferredLevel: PreferredLevel | null;
  weeklyGoalMinutes: number | null;
  preferredCategoryIds: number[];
}

export async function getLearningPreferences(): Promise<LearningPreferencesResponse> {
  const { data } = await api.get<LearningPreferencesResponse>('/api/v1/learner-profile/me/preferences');
  return data;
}

export async function updateLearningPreferences(
  payload: UpdateLearningPreferencesPayload,
): Promise<LearningPreferencesResponse> {
  const { data } = await api.put<LearningPreferencesResponse>('/api/v1/learner-profile/me/preferences', payload);
  return data;
}
