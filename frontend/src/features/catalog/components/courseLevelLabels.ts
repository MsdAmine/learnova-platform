import type { CourseLevel } from '../../../api/courses';

// Mirrors the LEVEL_LABELS map in CourseCatalogCard.tsx. Kept duplicated
// there rather than imported from here: that card is the already-shipped,
// enrollment-bearing catalog surface and this module exists only to share the
// map between the discovery-preview card and its hover/focus detail panel.
export const LEVEL_LABELS: Record<CourseLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'All levels',
};
