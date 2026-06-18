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
  progress: 'bg-salem',
  learning: 'bg-learning',
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
    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${fillClasses[variant]}`}
        style={{ width: `${clamped}%` }}
        role="progressbar"
        aria-label={label ?? 'Course progress'}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
