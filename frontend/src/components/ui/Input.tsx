import { cloneElement, type InputHTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
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

export function Input({ hasError = false, endAdornment, disabled, className, ref, ...props }: InputProps & { ref?: Ref<HTMLInputElement> }) {
  return (
    <div className="relative">
      <input
        ref={ref}
        disabled={disabled}
        aria-invalid={hasError || undefined}
        className={cn(
          'w-full bg-surface text-text-primary text-body',
          'border border-border-default rounded-md',
          'py-3 px-4',
          'placeholder:text-text-muted',
          'transition-colors duration-fast ease-out',
          'focus:outline-none',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
          hasError
            ? 'border-error focus:border-error focus-visible:outline-error'
            : 'focus:border-salem focus-visible:outline-salem',
          disabled && 'bg-surface-elevated text-text-muted cursor-not-allowed',
          endAdornment && 'pr-11',
          className,
        )}
        {...props}
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          {endAdornment}
        </div>
      )}
    </div>
  );
}

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
  const errorId = error ? `${htmlFor}-error` : undefined;
  const hintId = hint && !error ? `${htmlFor}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-xs', className)}>
      <label
        htmlFor={htmlFor}
        className="text-body-sm font-medium text-text-secondary"
      >
        {label}
      </label>
      {cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-describedby': describedBy })}
      {error ? (
        <p id={errorId} className="text-body-sm text-error" role="alert">{error}</p>
      ) : hint ? (
        <p id={hintId} className="text-body-sm text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
