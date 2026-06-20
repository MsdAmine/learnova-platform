import type { BadgeVariant } from '../../../../components/ui/Badge';
import type { ProfileType } from '../../../../types/profile';

// ─── Shared types ───────────────────────────────────────────────────────────

export interface SettingsUser {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
  availableProfiles: ProfileType[];
  instructorApprovalStatus: string | null;
}

export type SettingsSectionId = 'profile' | 'learning-preferences' | 'instructor' | 'account';

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

export function roleDisplay(role: string): { label: string; variant: BadgeVariant } {
  switch (role) {
    case 'ROLE_LEARNER':    return { label: 'Learner',    variant: 'default' };
    case 'ROLE_INSTRUCTOR': return { label: 'Instructor', variant: 'salem'   };
    case 'ROLE_ADMIN':      return { label: 'Admin',      variant: 'azure'   };
    default: {
      const label = role
        .replace(/^ROLE_/, '')
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      return { label, variant: 'default' };
    }
  }
}

export function profileVariant(profile: ProfileType): BadgeVariant {
  return profile === 'INSTRUCTOR' ? 'salem' : 'default';
}

export function profileLabel(profile: ProfileType): string {
  return profile === 'INSTRUCTOR' ? 'Instructor' : 'Learner';
}

export function textareaInputClass(hasError = false): string {
  return [
    'w-full bg-surface text-text-primary text-body',
    'border rounded-md py-3 px-4',
    'placeholder:text-text-muted',
    'transition-colors duration-fast ease-out',
    'focus:outline-none resize-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
    hasError
      ? 'border-error focus:border-error focus-visible:outline-error'
      : 'border-border-default focus:border-salem focus-visible:outline-salem',
  ].join(' ');
}

export function selectInputClass(hasError = false): string {
  return [
    'w-full bg-surface text-text-primary text-body cursor-pointer',
    'border rounded-md py-3 px-4',
    'transition-colors duration-fast ease-out',
    'focus:outline-none',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1',
    hasError
      ? 'border-error focus:border-error focus-visible:outline-error'
      : 'border-border-default focus:border-salem focus-visible:outline-salem',
  ].join(' ');
}
