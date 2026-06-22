import type { ReactNode } from 'react';

/**
 * A calm, bordered panel for dashboard empty and error states.
 * No spinners, no illustrations, no red — matches the product's quiet tone.
 * Pass `onRetry` to render a "Try again" action (used for fetch errors).
 * Pass `action` to render an arbitrary CTA below the message (e.g. a link).
 */
export function StatePanel({
  title,
  message,
  onRetry,
  action,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
}) {
  return (
    <div className="bg-surface border border-border-default rounded-lg px-6 py-12 text-center">
      {title && (
        <p className="text-body-sm font-medium text-text-primary mb-1">{title}</p>
      )}
      <p className="text-body-sm text-text-secondary">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center text-body-sm font-medium text-salem min-h-[44px] px-1 rounded-sm hover:text-salem-400 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
        >
          Try again
        </button>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
