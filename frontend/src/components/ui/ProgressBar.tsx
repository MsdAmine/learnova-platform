export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
      <div
        className="h-full bg-salem rounded-full"
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
