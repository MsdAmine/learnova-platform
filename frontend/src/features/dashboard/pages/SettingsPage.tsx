import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import api from '../../../api/axios';
import { Button } from '../../../components/ui/Button';
import { Badge, type BadgeVariant } from '../../../components/ui/Badge';
import { FormField, Input } from '../../../components/ui/Input';
import type { ProfileType } from '../../../types/profile';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}

function roleDisplay(role: string): { label: string; variant: BadgeVariant } {
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

function profileVariant(profile: ProfileType): BadgeVariant {
  return profile === 'INSTRUCTOR' ? 'salem' : 'default';
}

function profileLabel(profile: ProfileType): string {
  return profile === 'INSTRUCTOR' ? 'Instructor' : 'Learner';
}

// ─── Local shape (mirrors AuthContext User, not re-exported) ──────────────────

interface SettingsUser {
  id: number;
  fullName: string;
  email: string;
  roles: string[];
  availableProfiles: ProfileType[];
  instructorApprovalStatus: string | null;
}

// ─── SettingsSection ──────────────────────────────────────────────────────────

interface SettingsSectionProps {
  id: string;
  heading: string;
  description?: string;
  children: ReactNode;
}

function SettingsSection({ id, heading, description, children }: SettingsSectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="bg-surface border border-border-default rounded-lg p-4"
    >
      <h2 id={id} className="text-title-sm font-semibold text-text-primary">
        {heading}
      </h2>
      {description && (
        <p className="text-body-sm text-text-secondary mt-1">{description}</p>
      )}
      {children}
    </section>
  );
}

// ─── InfoRow ──────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="py-3 flex items-start justify-between gap-4">
      <dt className="text-body-sm font-medium text-text-primary flex-shrink-0">{label}</dt>
      <dd className="text-body-sm text-text-secondary text-right min-w-0 break-words">
        {children}
      </dd>
    </div>
  );
}

// ─── AccountOverview ──────────────────────────────────────────────────────────

interface AccountOverviewProps {
  user: SettingsUser;
  activeProfile: ProfileType | null;
}

function AccountOverview({ user, activeProfile }: AccountOverviewProps) {
  const initials    = user.fullName ? getInitials(user.fullName) : '?';
  const displayName = user.fullName || user.email;

  return (
    <div className="flex items-center gap-3 bg-surface border border-border-default rounded-lg p-4 mb-8">
      <div
        aria-hidden="true"
        className="w-10 h-10 rounded-full bg-salem-50 text-salem flex items-center justify-center text-caption font-semibold leading-none select-none flex-shrink-0"
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-text-primary truncate">{displayName}</p>
        <p className="text-caption text-text-secondary">{user.email}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {activeProfile !== null && (
            <>
              <span className="text-caption text-text-secondary">Active:</span>
              <Badge variant={profileVariant(activeProfile)}>
                {profileLabel(activeProfile)}
              </Badge>
            </>
          )}
          {user.roles
            .map(role => roleDisplay(role))
            // The active-profile badge already names this role; repeating it
            // reads as a duplicate (e.g. "Active: Learner Learner").
            .filter(({ label }) => activeProfile === null || label !== profileLabel(activeProfile))
            .map(({ label, variant }) => (
              <Badge key={label} variant={variant}>{label}</Badge>
            ))}
          {user.instructorApprovalStatus === 'PENDING' && (
            <Badge variant="default">Pending review</Badge>
          )}
          {user.instructorApprovalStatus === 'REJECTED' && (
            <Badge variant="coral">Rejected</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── InstructorApplicationPanel ───────────────────────────────────────────────

interface ApplicationFormErrors {
  bio?: string;
  expertise?: string;
  experience?: string;
  motivation?: string;
}

function textareaInputClass(hasError = false): string {
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

function InstructorApplicationPanel() {
  const { user, refreshUser } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});

  const status            = user?.instructorApprovalStatus ?? null;
  const availableProfiles = user?.availableProfiles ?? [];

  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'REJECTED') return;
    let cancelled = false;
    api.get<{ rejectionReason: string | null }>('/api/v1/instructor-profile/me')
      .then(({ data }) => {
        if (!cancelled) setRejectionReason(data.rejectionReason ?? null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedBio        = bio.trim();
    const trimmedExpertise  = expertise.trim();
    const trimmedExperience = experience.trim();
    const trimmedMotivation = motivation.trim();

    const errors: ApplicationFormErrors = {};
    if (!trimmedBio)                    errors.bio       = 'Bio is required.';
    else if (trimmedBio.length > 1000)  errors.bio       = 'Bio must not exceed 1000 characters.';

    if (!trimmedExpertise)                      errors.expertise = 'Expertise is required.';
    else if (trimmedExpertise.length > 500)     errors.expertise = 'Expertise must not exceed 500 characters.';

    if (trimmedExperience.length > 1000) errors.experience = 'Experience must not exceed 1000 characters.';
    if (trimmedMotivation.length > 1000) errors.motivation = 'Motivation must not exceed 1000 characters.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsApplying(true);
    setApplyError(null);
    try {
      await api.post('/api/v1/instructor-profile/request', {
        bio: trimmedBio,
        expertise: trimmedExpertise,
        experience: trimmedExperience || null,
        motivation: trimmedMotivation || null,
      });
      const { data } = await api.get<SettingsUser>('/api/v1/auth/me');
      refreshUser(data);
    } catch {
      setApplyError('We could not submit your instructor application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  }

  if (status === null) {
    return (
      <SettingsSection
        id="instructor-application-heading"
        heading="Instructor application"
        description="Share your expertise with learners on Learnova."
      >
        <form onSubmit={handleSubmit} noValidate className="mt-4 flex flex-col gap-4">
          <p className="text-body-sm text-text-secondary">
            Tell us about your background. Fields marked with * are required.
          </p>

          <FormField
            label="Bio *"
            htmlFor="instructor-bio"
            error={fieldErrors.bio}
            hint="Max 1000 characters."
          >
            <textarea
              id="instructor-bio"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Share your teaching background and what you specialize in."
              aria-invalid={fieldErrors.bio ? true : undefined}
              className={textareaInputClass(!!fieldErrors.bio)}
            />
          </FormField>

          <FormField
            label="Expertise *"
            htmlFor="instructor-expertise"
            error={fieldErrors.expertise}
            hint="Max 500 characters."
          >
            <Input
              id="instructor-expertise"
              value={expertise}
              onChange={e => setExpertise(e.target.value)}
              maxLength={500}
              hasError={!!fieldErrors.expertise}
              placeholder="e.g. JavaScript, React, Web Development"
            />
          </FormField>

          <FormField
            label="Experience"
            htmlFor="instructor-experience"
            error={fieldErrors.experience}
            hint="Optional. Max 1000 characters."
          >
            <textarea
              id="instructor-experience"
              value={experience}
              onChange={e => setExperience(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Describe your teaching or professional experience."
              aria-invalid={fieldErrors.experience ? true : undefined}
              className={textareaInputClass(!!fieldErrors.experience)}
            />
          </FormField>

          <FormField
            label="Motivation"
            htmlFor="instructor-motivation"
            error={fieldErrors.motivation}
            hint="Optional. Max 1000 characters."
          >
            <textarea
              id="instructor-motivation"
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Why do you want to teach on Learnova?"
              aria-invalid={fieldErrors.motivation ? true : undefined}
              className={textareaInputClass(!!fieldErrors.motivation)}
            />
          </FormField>

          <div>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              loading={isApplying}
              aria-label="Submit instructor application"
            >
              Submit instructor application
            </Button>
            {applyError && (
              <p className="text-caption text-error mt-1" role="alert">{applyError}</p>
            )}
          </div>
        </form>
      </SettingsSection>
    );
  }

  if (status === 'PENDING') {
    return (
      <SettingsSection
        id="instructor-application-heading"
        heading="Instructor application"
        description="Your application is under review."
      >
        <div className="mt-4">
          <div className="flex items-start gap-2.5">
            <Badge variant="default">Pending review</Badge>
            <p className="text-body-sm text-text-secondary">
              Your application has been submitted and is awaiting admin review.
            </p>
          </div>
          <p className="text-caption text-text-muted mt-3">
            No action is required. You will gain access to instructor mode once approved.
          </p>
        </div>
      </SettingsSection>
    );
  }

  if (status === 'APPROVED') {
    const hasInstructorAccess = availableProfiles.includes('INSTRUCTOR');
    return (
      <SettingsSection
        id="instructor-application-heading"
        heading="Instructor application"
        description="Your instructor application has been approved."
      >
        <div className="mt-4">
          <div className="flex items-start gap-2.5">
            <Badge variant="salem">Approved</Badge>
            <p className="text-body-sm text-text-secondary">
              You have access to instructor mode.
            </p>
          </div>
          {hasInstructorAccess ? (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-body-sm text-text-secondary">
                Manage your courses, content, and publishing from the instructor workspace.
              </p>
              <div>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/instructor/courses">Go to teaching area</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-caption text-text-muted mt-3">
              Instructor access is being set up. Refresh your account data if this persists.
            </p>
          )}
        </div>
      </SettingsSection>
    );
  }

  if (status === 'REJECTED') {
    return (
      <SettingsSection
        id="instructor-application-heading"
        heading="Instructor application"
        description="Your instructor application was not approved."
      >
        <div className="mt-4">
          <div className="flex items-start gap-2.5">
            <Badge variant="coral">Rejected</Badge>
            <p className="text-body-sm text-text-secondary">
              Your application was not approved at this time.
            </p>
          </div>
          {rejectionReason && (
            <div className="mt-3 rounded-md border border-border-default bg-surface-elevated p-3">
              <p className="text-caption font-medium text-text-muted">Reason</p>
              <p className="text-body-sm text-text-secondary mt-1">{rejectionReason}</p>
            </div>
          )}
          <p className="text-caption text-text-muted mt-3">
            Contact support if you have questions about your application status.
          </p>
        </div>
      </SettingsSection>
    );
  }

  return null;
}

// ─── AdminAccessPanel ─────────────────────────────────────────────────────────

function AdminAccessPanel() {
  const { user } = useAuth();
  if (!user?.roles.includes('ROLE_ADMIN')) return null;

  return (
    <SettingsSection
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
    </SettingsSection>
  );
}

// ─── AccountActionsPanel ──────────────────────────────────────────────────────

function AccountActionsPanel() {
  const { logout, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const { data } = await api.get<SettingsUser>('/api/v1/auth/me');
      refreshUser(data);
    } catch {
      setRefreshError('Could not refresh account data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <SettingsSection
      id="account-actions-heading"
      heading="Account actions"
      description="Manage your current session."
    >
      <div className="mt-4 flex flex-col gap-2">
        <div>
          <Button
            variant="secondary"
            size="sm"
            loading={isRefreshing}
            aria-label="Refresh account data"
            onClick={handleRefresh}
          >
            Refresh account data
          </Button>
          {refreshError && (
            <p className="text-caption text-error mt-1" role="alert">{refreshError}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Sign out of your account"
          onClick={logout}
        >
          Sign out
        </Button>
      </div>
    </SettingsSection>
  );
}

// ─── SettingsPage ─────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, activeProfile, logout, isAuthenticated } = useAuth();
  useCurrentUser();

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

  return (
    <div className="px-8 py-8 pb-14 max-w-container mx-auto">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-title font-semibold text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage your account, profile, and learning preferences.
        </p>
      </div>

      {/* Account overview — full-width summary card */}
      <AccountOverview user={user} activeProfile={activeProfile} />

      {/* Settings grid: left = main, right = support panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">

        {/* Left column */}
        <div className="flex flex-col gap-4">

          <SettingsSection
            id="profile-info-heading"
            heading="Profile information"
            description="Your account name and email address."
          >
            <dl className="divide-y divide-border-default mt-4">
              <InfoRow label="Full name">
                {user.fullName || 'Not set'}
              </InfoRow>
              <InfoRow label="Email">
                {user.email}
              </InfoRow>
            </dl>
            <p className="text-caption text-text-muted mt-3">
              Profile editing is not available yet.
            </p>
          </SettingsSection>

          <SettingsSection
            id="learning-prefs-heading"
            heading="Learning preferences"
            description="Customize your learning experience."
          >
            <div className="mt-4">
              <p className="text-body-sm text-text-secondary">
                Learning preferences are not available yet.
              </p>
              <p className="text-caption text-text-muted mt-1">
                Email notifications, course reminders, and pace settings will appear here when available.
              </p>
            </div>
          </SettingsSection>

        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          <SettingsSection
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
          </SettingsSection>

          {(!user.roles.includes('ROLE_ADMIN') || user.availableProfiles.includes('INSTRUCTOR')) && (
            <InstructorApplicationPanel />
          )}

          <AdminAccessPanel />

          <AccountActionsPanel />

        </div>
      </div>
    </div>
  );
}
