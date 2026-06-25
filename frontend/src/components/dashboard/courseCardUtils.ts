export interface Course {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  thumbnailUrl?: string | null;
  gradient?: { from: string; to: string };
}

const DEFAULT_GRADIENT = { from: 'var(--color-salem)', to: 'var(--color-salem-400)' } as const;

export function courseGradient(course: Course): string {
  const { from, to } = course.gradient ?? DEFAULT_GRADIENT;
  return `linear-gradient(140deg, ${from}, ${to})`;
}

// Backend enrollments carry no thumbnail/gradient. To keep cards visually
// distinct without inventing data, derive a card gradient deterministically
// from the course id, cycling through the salem-family shades already used in
// the design. Same id → same gradient on every render.
const CARD_GRADIENTS: ReadonlyArray<{ from: string; to: string }> = [
  { from: '#032117', to: '#1A3B2E' },
  { from: '#1A3B2E', to: '#5C7B6F' },
  { from: '#02180F', to: '#032117' },
  { from: '#5C7B6F', to: '#C9D5D0' },
  { from: '#032117', to: '#98AFA6' },
];

export function gradientForId(id: number): { from: string; to: string } {
  const index = Math.abs(Math.trunc(id)) % CARD_GRADIENTS.length;
  return CARD_GRADIENTS[index];
}
