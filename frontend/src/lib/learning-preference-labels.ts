import type { LearningGoal, PreferredLevel } from '../api/learningPreferences';

export const LEARNING_GOAL_LABELS: Record<LearningGoal, string> = {
  CAREER_GROWTH: 'Career growth',
  SKILL_UP: 'Build a new skill',
  ACADEMIC: 'Academic / coursework',
  HOBBY: 'Personal interest / hobby',
  NOT_SURE: 'Not sure yet',
};

export const PREFERRED_LEVEL_LABELS: Record<PreferredLevel, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  ADVANCED: 'Advanced',
  ALL_LEVELS: 'Any level',
};
