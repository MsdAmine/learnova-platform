import { cn } from '../../lib/cn';

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

interface FilterTabsProps<T extends string> {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: FilterTabsProps<T>) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label={ariaLabel}>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={cn(
            'px-3 py-1.5 text-body-sm font-medium rounded-md transition-colors duration-fast min-h-[44px]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
            value === option.value
              ? 'bg-salem-50 text-salem'
              : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
