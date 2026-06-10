export interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  gradient?: { from: string; to: string };
}

const DEFAULT_GRADIENT = { from: 'var(--color-salem)', to: 'var(--color-salem-400)' } as const;

export function courseGradient(course: Course): string {
  const { from, to } = course.gradient ?? DEFAULT_GRADIENT;
  return `linear-gradient(140deg, ${from}, ${to})`;
}
