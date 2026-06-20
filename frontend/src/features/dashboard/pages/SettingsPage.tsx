import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { Button } from '../../../components/ui/Button';
import { SettingsShell } from '../components/settings/SettingsShell';
import type { SettingsNavItem } from '../components/settings/SettingsSectionNav';
import { ProfileSection } from '../components/settings/ProfileSection';
import { LearningPreferencesSection } from '../components/settings/LearningPreferencesSection';
import { InstructorSection } from '../components/settings/InstructorSection';
import { AccountSection } from '../components/settings/AccountSection';
import { SettingsCard } from '../components/settings/shared';
import type { SettingsSectionId } from '../components/settings/settingsHelpers';

const DEFAULT_SECTION: SettingsSectionId = 'profile';

const ALL_SECTIONS: SettingsSectionId[] = ['profile', 'learning-preferences', 'instructor', 'account'];

function isSettingsSectionId(value: string | null): value is SettingsSectionId {
  return value !== null && (ALL_SECTIONS as string[]).includes(value);
}

export default function SettingsPage() {
  const { user, activeProfile, logout, isAuthenticated } = useAuth();
  useCurrentUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get('section');
  const activeSection = isSettingsSectionId(requestedSection) ? requestedSection : DEFAULT_SECTION;

  const setActiveSection = useCallback((id: SettingsSectionId) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('section', id);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Token is present but user object not yet hydrated (transient on mount).
  // The Axios 401 interceptor handles the real error case by redirecting to /login.
  if (!user && isAuthenticated) {
    return (
      <div className="px-8 py-8 pb-14 max-w-container mx-auto">
        <div className="bg-surface border border-border-default rounded-lg p-4">
          <p className="text-body-sm font-semibold text-text-primary mb-1">
            Account information is unavailable.
          </p>
          <p className="text-body-sm text-text-secondary mb-3">
            Please try refreshing the page or signing in again.
          </p>
          <Button variant="secondary" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // Mirrors the old InstructorApplicationPanel guard: an admin-only account
  // (no instructor access) has nothing real to show in an Instructor tab.
  const showInstructorTab = !user.roles.includes('ROLE_ADMIN') || user.availableProfiles.includes('INSTRUCTOR');

  const navItems: SettingsNavItem[] = [
    { id: 'profile', label: 'My profile' },
    { id: 'learning-preferences', label: 'Learning preferences' },
    ...(showInstructorTab ? [{ id: 'instructor' as const, label: 'Instructor' }] : []),
    { id: 'account', label: 'Account' },
  ];

  const resolvedSection = activeSection === 'instructor' && !showInstructorTab ? DEFAULT_SECTION : activeSection;

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-title font-semibold text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage your account, profile, and learning preferences.
        </p>
      </div>

      <SettingsShell items={navItems} active={resolvedSection} onChange={setActiveSection}>
        {resolvedSection === 'profile' && (
          <ProfileSection user={user} activeProfile={activeProfile} />
        )}

        {resolvedSection === 'learning-preferences' && (
          <SettingsCard
            id="learning-prefs-heading"
            heading="Learning preferences"
            description="Tell Learnova what you want to learn so future course discovery and onboarding can feel more relevant."
          >
            <LearningPreferencesSection />
          </SettingsCard>
        )}

        {resolvedSection === 'instructor' && showInstructorTab && (
          <InstructorSection />
        )}

        {resolvedSection === 'account' && (
          <AccountSection user={user} activeProfile={activeProfile} />
        )}
      </SettingsShell>
    </div>
  );
}
