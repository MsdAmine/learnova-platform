import api from './axios';
import type { CourseLevel } from './courses';

// ── Types (mirror backend CourseSuggestionsResponse / SuggestedCourseResponse) ──
// Rules-based, transparent suggestions — not a recommendation engine. The DTO
// carries only display fields plus human-readable `matchReasons` (e.g.
// "Matches your interest in Data Analytics"). No score or other internal field
// is ever sent. `personalized` is true only when at least one course matches the
// learner's saved preferences; otherwise `courses` is an honest recently-added
// fallback and `matchReasons` is empty.

export interface SuggestedCourse {
  id: number;
  title: string;
  description: string;
  categoryName: string | null;
  level: CourseLevel;
  thumbnailUrl: string | null;
  instructorName: string;
  createdAt: string;
  matchReasons: string[];
}

export interface CourseSuggestionsResponse {
  personalized: boolean;
  reason: string;
  courses: SuggestedCourse[];
}

// ── API call (always via the shared Axios instance) ────────────────────────────

export async function getCourseSuggestions(): Promise<CourseSuggestionsResponse> {
  const { data } = await api.get<CourseSuggestionsResponse>('/api/v1/learner/course-suggestions');
  return data;
}
