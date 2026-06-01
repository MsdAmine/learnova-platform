import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'inverted' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'bg-salem text-white border-transparent',
    'hover:bg-salem-400 hover:border-salem-400',
    'active:bg-salem-600 active:border-salem-600',
    'focus-visible:outline-salem',
  ].join(' '),
  secondary: [
    'bg-surface text-text-primary border-border-default',
    'hover:bg-surface-elevated hover:border-border-hover',
    'focus-visible:outline-salem',
  ].join(' '),
  ghost: [
    'bg-transparent text-salem border-transparent',
    'hover:bg-ghost-hover',
    'focus-visible:outline-salem',
  ].join(' '),
  inverted: [
    'bg-surface text-salem border-transparent',
    'hover:bg-surface-elevated',
    'focus-visible:outline-white',
  ].join(' '),
  destructive: [
    'bg-error text-white border-transparent',
    'hover:bg-error-600 hover:border-error-600',
    'active:bg-error-700 active:border-error-700',
    'focus-visible:outline-error',
  ].join(' '),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[13px] py-2 px-4',
  md: 'text-[14px] py-2.5 px-5',
  lg: 'text-[15px] py-3 px-7',
};

const buttonClasses = (
  variant: ButtonVariant,
  size: ButtonSize,
  loading: boolean,
  className?: string,
) =>
  cn(
    'relative inline-flex items-center justify-center rounded-md border',
    'font-semibold leading-none whitespace-nowrap select-none cursor-pointer',
    'transition-[background-color,border-color,transform] duration-[180ms] ease-out',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
    'active:scale-[0.98]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    loading && 'cursor-wait',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      asChild = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={buttonClasses(variant, size, loading, className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses(variant, size, loading, className)}
        {...props}
      >
        <span className={cn(loading && 'invisible')}>{children}</span>
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <Spinner />
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function Spinner() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity={0.3} strokeWidth="2" />
      <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
