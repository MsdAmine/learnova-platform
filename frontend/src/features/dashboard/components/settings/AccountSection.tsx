import { Link } from 'react-router-dom';
import { ArrowRightLeft } from 'lucide-react';
import { useAuth } from '../../../../context/AuthContext';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import type { ProfileType } from '../../../../types/profile';
import { SettingsCard, InfoRow } from './shared';
import { roleDisplay, profileVariant, profileLabel, type SettingsUser } from './settingsHelpers';

interface AccountSectionProps {
  user: SettingsUser;
  activeProfile: ProfileType | null;
}

export function AccountSection({ user, activeProfile }: AccountSectionProps) {
  const { setActiveProfile } = useAuth();

  const hasInstructorAccess = user.availableProfiles.includes('INSTRUCTOR');

  return (
    <div className="flex flex-col gap-4">
      <SettingsCard
        id="active-profile-heading"
        heading="Active profile and roles"
        description="Your current session and available account profiles."
      >
        <dl className="divide-y divide-border-default mt-4">
          <InfoRow label="Active profile">
            {activeProfile
              ? <Badge variant={profileVariant(activeProfile)}>{profileLabel(activeProfile)}</Badge>
              : <span className="text-text-muted">None</span>
            }
          </InfoRow>
          <InfoRow label="Available">
            <span className="flex flex-wrap justify-end gap-1.5">
              {user.availableProfiles.map(profile => (
                <Badge key={profile} variant={profileVariant(profile)}>
                  {profileLabel(profile)}
                </Badge>
              ))}
            </span>
          </InfoRow>
          <InfoRow label="Roles">
            <span className="flex flex-wrap justify-end gap-1.5">
              {user.roles.map(role => {
                const { label, variant } = roleDisplay(role);
                return <Badge key={role} variant={variant}>{label}</Badge>;
              })}
            </span>
          </InfoRow>
        </dl>

        {hasInstructorAccess && (
          <div className="mt-4 pt-4 border-t border-border-default flex flex-col items-start sm:flex-row sm:items-center gap-2.5">
            <div className="flex items-center gap-2.5 flex-1">
              <ArrowRightLeft size={14} className="text-salem flex-shrink-0" aria-hidden="true" />
              <p className="text-body-sm text-text-secondary">
                {activeProfile === 'INSTRUCTOR'
                  ? 'You are browsing as an instructor.'
                  : 'You are browsing as a learner.'}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActiveProfile(activeProfile === 'INSTRUCTOR' ? 'LEARNER' : 'INSTRUCTOR')}
              aria-label={activeProfile === 'INSTRUCTOR' ? 'Switch to learner profile' : 'Switch to instructor profile'}
            >
              {activeProfile === 'INSTRUCTOR' ? 'Switch to learner' : 'Switch to instructor'}
            </Button>
          </div>
        )}
      </SettingsCard>

      {user.roles.includes('ROLE_ADMIN') && (
        <SettingsCard
          id="admin-access-heading"
          heading="Admin area"
          description="Platform administration tools."
        >
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-body-sm text-text-secondary">
              Review instructor applications and manage administrative workflows.
            </p>
            <div>
              <Button asChild variant="secondary" size="sm">
                <Link to="/admin/instructor-approvals">Go to admin area</Link>
              </Button>
            </div>
          </div>
        </SettingsCard>
      )}
    </div>
  );
}
