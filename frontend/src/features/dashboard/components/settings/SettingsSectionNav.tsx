import { cn } from '../../../../lib/cn';
import type { SettingsSectionId } from './settingsHelpers';

export interface SettingsNavItem {
  id: SettingsSectionId;
  label: string;
}

interface SettingsSectionNavProps {
  items: SettingsNavItem[];
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
}

// Horizontal scrollable row on mobile, vertical list on md+. A single
// responsive markup avoids maintaining two near-identical nav components.
export function SettingsSectionNav({ items, active, onChange }: SettingsSectionNavProps) {
  return (
    <nav aria-label="Settings sections" className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
      {items.map(item => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex-shrink-0 md:flex-shrink text-left whitespace-nowrap',
              'px-3.5 py-2.5 rounded-md text-body-sm font-medium min-h-[44px]',
              'transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem',
              isActive
                ? 'bg-salem text-on-dark'
                : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
