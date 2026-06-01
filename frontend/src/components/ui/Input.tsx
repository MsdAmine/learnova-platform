import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

// ─────────────────────────────────────────────────────────────────────────────
// Input
//
// Stroke-only at rest (Flat-At-Rest Rule). Salem border on focus, Error Red on
// error state. endAdornment slot for icons (e.g. password-visibility toggle).
// ─────────────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ hasError = false, endAdornment, disabled, className, ...props }, ref) => (
    <div className="relative">
      <input
        ref={ref}
        disabled={disabled}
        className={cn(
          'w-full bg-surface text-text-primary text-body',
          'border border-border-default rounded-md',
          'py-3 px-4',
          'placeholder:text-text-muted',
          'transition-colors duration-fast ease-out',
          'focus:outline-none focus:border-salem',
          hasError && 'border-error focus:border-error',
          disabled && 'bg-surface-elevated text-text-muted cursor-not-allowed',
          endAdornment && 'pr-10',
          className,
        )}
        {...props}
      />
      {endAdornment && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {endAdornment}
        </div>
      )}
    </div>
  ),
);

Input.displayName = 'Input';

// ─────────────────────────────────────────────────────────────────────────────
// FormField
//
// Label + input slot + error/hint line. Error takes priority over hint.
// ─────────────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, htmlFor, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      <label
        htmlFor={htmlFor}
        className="text-body-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-body-sm text-error" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-body-sm text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
