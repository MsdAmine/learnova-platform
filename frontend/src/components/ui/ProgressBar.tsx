// ─────────────────────────────────────────────────────────────────────────────
// fill variants
//
// progress  → lesson/course completion (Salem) — default, unchanged behavior
// learning  → analytics/learning-metrics contexts (Azure/Learning) — per
//             DESIGN.md §5 Progress Bars and the purple/blue refresh spec
//             (docs/design/brand-refresh-purple-blue-spec.md). Not used for
//             lesson-completion progress.
// ─────────────────────────────────────────────────────────────────────────────

export type ProgressBarVariant = 'progress' | 'learning';

const fillClasses: Record<ProgressBarVariant, string> = {
  progress: '[&::-webkit-progress-value]:bg-salem [&::-moz-progress-bar]:bg-salem',
  learning: '[&::-webkit-progress-value]:bg-learning [&::-moz-progress-bar]:bg-learning',
};

export function ProgressBar({
  value,
  label,
  variant = 'progress',
}: {
  value: number;
  label?: string;
  variant?: ProgressBarVariant;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <progress
      className={`h-1 w-full appearance-none overflow-hidden rounded-full bg-surface-elevated [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-surface-elevated [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full ${fillClasses[variant]}`}
      value={clamped}
      max={100}
      aria-label={label ?? 'Course progress'}
    />
  );
}
