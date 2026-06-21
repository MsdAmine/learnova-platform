import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { SettingsSectionNav, type SettingsNavItem } from './SettingsSectionNav';
import type { SettingsSectionId } from './settingsHelpers';

interface SettingsShellProps {
  items: SettingsNavItem[];
  active: SettingsSectionId;
  onChange: (id: SettingsSectionId) => void;
  children: ReactNode;
}

// Reference-inspired account-settings shell: a single bordered surface
// split into a left section nav and a right content panel. Stacks on
// mobile so the nav becomes a horizontal scroller above the content.
export function SettingsShell({ items, active, onChange, children }: SettingsShellProps) {
  const { logout } = useAuth();

  return (
    <div className="bg-surface border border-border-default rounded-lg flex flex-col md:flex-row overflow-hidden">
      <div className="md:w-[220px] flex-shrink-0 border-b md:border-b-0 md:border-r border-border-default p-3 md:p-4 flex flex-col gap-3">
        <SettingsSectionNav items={items} active={active} onChange={onChange} />

        <div className="pt-3 border-t border-border-default">
          <button
            type="button"
            onClick={logout}
            aria-label="Sign out of your account"
            className="flex items-center gap-2 w-full text-left px-3.5 py-2.5 rounded-md text-body-sm font-medium min-h-[44px] bg-coral-50 text-coral-700 transition-colors duration-fast hover:bg-[#FFD2C2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            <LogOut size={14} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
      <div className="flex-1 min-w-0 p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
