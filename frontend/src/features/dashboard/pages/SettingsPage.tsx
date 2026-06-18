import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { useProfileSwitch } from '../../../hooks/useProfileSwitch';
import api from '../../../api/axios';
import {
  getMyLearnerProfile,
  updateMyLearnerProfile,
  getMyInstructorProfile,
  updateMyInstructorProfile,
  type LearnerProfileResponse,
  type InstructorProfileResponse,
} from '../../../api/profile';
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

// ─── LearnerProfileSection ─────────────────────────────────────────────────────

interface LearnerProfileFormErrors {
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
}

function LearnerProfileSection() {
  const [profile, setProfile] = useState<LearnerProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LearnerProfileFormErrors>({});
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyLearnerProfile()
      .then(data => { if (!cancelled) setProfile(data); })
      .catch(() => { if (!cancelled) setLoadError('Could not load your profile details.'); });
    return () => { cancelled = true; };
  }, []);

  function startEditing() {
    if (!profile) return;
    setDisplayName(profile.displayName);
    setBio(profile.bio ?? '');
    setProfileImageUrl(profile.profileImageUrl ?? '');
    setFieldErrors({});
    setFormError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedDisplayName = displayName.trim();
    const trimmedBio = bio.trim();
    const trimmedImageUrl = profileImageUrl.trim();

    const errors: LearnerProfileFormErrors = {};
    if (!trimmedDisplayName) errors.displayName = 'Display name is required.';
    else if (trimmedDisplayName.length > 150) errors.displayName = 'Display name must not exceed 150 characters.';
    if (trimmedBio.length > 500) errors.bio = 'Bio must not exceed 500 characters.';
    if (trimmedImageUrl.length > 500) errors.profileImageUrl = 'Profile image URL must not exceed 500 characters.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await updateMyLearnerProfile({
        displayName: trimmedDisplayName,
        bio: trimmedBio,
        profileImageUrl: trimmedImageUrl,
      });
      setProfile(updated);
      setIsEditing(false);
    } catch {
      setFormError('We could not save your profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (loadError) {
    return <p className="text-body-sm text-error mt-3" role="alert">{loadError}</p>;
  }

  if (!profile) {
    return <p className="text-body-sm text-text-secondary mt-4">Loading profile details…</p>;
  }

  if (!isEditing) {
    return (
      <div className="mt-4">
        <dl className="divide-y divide-border-default">
          <InfoRow label="Display name">{profile.displayName}</InfoRow>
          <InfoRow label="Bio">{profile.bio || 'Not set'}</InfoRow>
          <InfoRow label="Profile image URL">{profile.profileImageUrl || 'Not set'}</InfoRow>
        </dl>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={startEditing} aria-label="Edit profile">
            Edit profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-4 grid gap-4">
      <FormField
        label="Display name *"
        htmlFor="learner-display-name"
        error={fieldErrors.displayName}
        hint="Max 150 characters."
      >
        <Input
          id="learner-display-name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={150}
          hasError={!!fieldErrors.displayName}
        />
      </FormField>

      <FormField
        label="Bio"
        htmlFor="learner-bio"
        error={fieldErrors.bio}
        hint="Optional. Max 500 characters."
      >
        <textarea
          id="learner-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Tell other learners a little about yourself."
          aria-invalid={fieldErrors.bio ? true : undefined}
          className={textareaInputClass(!!fieldErrors.bio)}
        />
      </FormField>

      <FormField
        label="Profile image URL"
        htmlFor="learner-profile-image-url"
        error={fieldErrors.profileImageUrl}
        hint="Optional. Max 500 characters."
      >
        <Input
          id="learner-profile-image-url"
          value={profileImageUrl}
          onChange={e => setProfileImageUrl(e.target.value)}
          maxLength={500}
          hasError={!!fieldErrors.profileImageUrl}
          placeholder="https://example.com/avatar.png"
        />
      </FormField>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelEditing}
          disabled={isSaving}
          aria-label="Cancel profile edits"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={isSaving}
          aria-label="Save profile changes"
        >
          Save changes
        </Button>
      </div>
      {formError && (
        <p className="text-caption text-error mt-1 text-right" role="alert">{formError}</p>
      )}
    </form>
  );
}

// ─── InstructorApplicationPanel ───────────────────────────────────────────────

interface ApplicationFormErrors {
  bio?: string;
  expertise?: string;
  experience?: string;
  motivation?: string;
}

interface InstructorProfileEditFormProps {
  profile: InstructorProfileResponse;
  onSaved: (profile: InstructorProfileResponse) => void;
}

function InstructorProfileEditForm({ profile, onSaved }: InstructorProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});
  const [bio, setBio] = useState(profile.bio);
  const [expertise, setExpertise] = useState(profile.expertise);
  const [experience, setExperience] = useState(profile.experience ?? '');
  const [motivation, setMotivation] = useState(profile.motivation ?? '');

  function startEditing() {
    setBio(profile.bio);
    setExpertise(profile.expertise);
    setExperience(profile.experience ?? '');
    setMotivation(profile.motivation ?? '');
    setFieldErrors({});
    setFormError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setFieldErrors({});
    setFormError(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedBio = bio.trim();
    const trimmedExpertise = expertise.trim();
    const trimmedExperience = experience.trim();
    const trimmedMotivation = motivation.trim();

    const errors: ApplicationFormErrors = {};
    if (!trimmedBio) errors.bio = 'Bio is required.';
    else if (trimmedBio.length > 1000) errors.bio = 'Bio must not exceed 1000 characters.';
    if (!trimmedExpertise) errors.expertise = 'Expertise is required.';
    else if (trimmedExpertise.length > 500) errors.expertise = 'Expertise must not exceed 500 characters.';
    if (trimmedExperience.length > 1000) errors.experience = 'Experience must not exceed 1000 characters.';
    if (trimmedMotivation.length > 1000) errors.motivation = 'Motivation must not exceed 1000 characters.';

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSaving(true);
    setFormError(null);
    try {
      const updated = await updateMyInstructorProfile({
        bio: trimmedBio,
        expertise: trimmedExpertise,
        experience: trimmedExperience,
        motivation: trimmedMotivation,
      });
      onSaved(updated);
      setIsEditing(false);
    } catch {
      setFormError('We could not save your instructor profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="mt-4 pt-4 border-t border-border-default">
        <dl className="divide-y divide-border-default">
          <InfoRow label="Bio">{profile.bio}</InfoRow>
          <InfoRow label="Expertise">{profile.expertise}</InfoRow>
          <InfoRow label="Experience">{profile.experience || 'Not set'}</InfoRow>
          <InfoRow label="Motivation">{profile.motivation || 'Not set'}</InfoRow>
        </dl>
        <div className="mt-3">
          <Button variant="secondary" size="sm" onClick={startEditing} aria-label="Edit instructor profile">
            Edit instructor profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-4 pt-4 border-t border-border-default grid gap-4 md:grid-cols-2"
    >
      <FormField
        label="Bio *"
        htmlFor="instructor-edit-bio"
        error={fieldErrors.bio}
        hint="Max 1000 characters."
        className="md:col-span-2"
      >
        <textarea
          id="instructor-edit-bio"
          value={bio}
          onChange={e => setBio(e.target.value)}
          maxLength={1000}
          rows={3}
          aria-invalid={fieldErrors.bio ? true : undefined}
          className={textareaInputClass(!!fieldErrors.bio)}
        />
      </FormField>

      <FormField
        label="Expertise *"
        htmlFor="instructor-edit-expertise"
        error={fieldErrors.expertise}
        hint="Max 500 characters."
      >
        <Input
          id="instructor-edit-expertise"
          value={expertise}
          onChange={e => setExpertise(e.target.value)}
          maxLength={500}
          hasError={!!fieldErrors.expertise}
        />
      </FormField>

      <FormField
        label="Experience"
        htmlFor="instructor-edit-experience"
        error={fieldErrors.experience}
        hint="Optional. Max 1000 characters."
      >
        <textarea
          id="instructor-edit-experience"
          value={experience}
          onChange={e => setExperience(e.target.value)}
          maxLength={1000}
          rows={3}
          aria-invalid={fieldErrors.experience ? true : undefined}
          className={textareaInputClass(!!fieldErrors.experience)}
        />
      </FormField>

      <FormField
        label="Motivation"
        htmlFor="instructor-edit-motivation"
        error={fieldErrors.motivation}
        hint="Optional. Max 1000 characters."
        className="md:col-span-2"
      >
        <textarea
          id="instructor-edit-motivation"
          value={motivation}
          onChange={e => setMotivation(e.target.value)}
          maxLength={1000}
          rows={3}
          aria-invalid={fieldErrors.motivation ? true : undefined}
          className={textareaInputClass(!!fieldErrors.motivation)}
        />
      </FormField>

      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelEditing}
          disabled={isSaving}
          aria-label="Cancel instructor profile edits"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          loading={isSaving}
          aria-label="Save instructor profile changes"
        >
          Save changes
        </Button>
      </div>
      {formError && (
        <p className="text-caption text-error mt-1 text-right md:col-span-2" role="alert">{formError}</p>
      )}
    </form>
  );
}

function InstructorApplicationPanel() {
  const { user, refreshUser } = useAuth();
  const { switching, error: switchError, switchTo } = useProfileSwitch();
  const [isApplying, setIsApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState('');
  const [experience, setExperience] = useState('');
  const [motivation, setMotivation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ApplicationFormErrors>({});

  const status            = user?.instructorApprovalStatus ?? null;
  const availableProfiles = user?.availableProfiles ?? [];

  const [instructorProfile, setInstructorProfile] = useState<InstructorProfileResponse | null>(null);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== 'REJECTED' && status !== 'APPROVED') return;
    let cancelled = false;
    getMyInstructorProfile()
      .then(data => { if (!cancelled) setInstructorProfile(data); })
      .catch(() => { if (!cancelled) setProfileLoadError('Could not load your instructor profile details.'); });
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
      >
        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] mt-4">
          <div>
            <p className="text-body-sm text-text-secondary">
              Share your expertise with learners on Learnova.
            </p>
            <p className="text-body-sm text-text-secondary mt-2">
              Tell us about your background. Fields marked with * are required.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="grid gap-4 md:grid-cols-2">
            <FormField
              label="Bio *"
              htmlFor="instructor-bio"
              error={fieldErrors.bio}
              hint="Max 1000 characters."
              className="md:col-span-2"
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
              className="md:col-span-2"
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

            <div className="md:col-span-2">
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  loading={isApplying}
                  aria-label="Submit instructor application"
                >
                  Submit instructor application
                </Button>
              </div>
              {applyError && (
                <p className="text-caption text-error mt-1 text-right" role="alert">{applyError}</p>
              )}
            </div>
          </form>
        </div>
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
                <Button
                  variant="secondary"
                  size="sm"
                  loading={switching}
                  aria-label="Go to teaching area"
                  onClick={() => void switchTo('INSTRUCTOR')}
                >
                  Go to teaching area
                </Button>
                {switchError && (
                  <p className="text-caption text-error mt-1" role="alert">{switchError}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-caption text-text-muted mt-3">
              Instructor access is being set up. Refresh your account data if this persists.
            </p>
          )}
        </div>

        {hasInstructorAccess && (
          <>
            {profileLoadError && (
              <p className="text-body-sm text-error mt-4" role="alert">{profileLoadError}</p>
            )}
            {!profileLoadError && !instructorProfile && (
              <p className="text-body-sm text-text-secondary mt-4">Loading instructor profile…</p>
            )}
            {instructorProfile && (
              <InstructorProfileEditForm profile={instructorProfile} onSaved={setInstructorProfile} />
            )}
          </>
        )}
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
          {instructorProfile?.rejectionReason && (
            <div className="mt-3 rounded-md border border-border-default bg-surface-elevated p-3">
              <p className="text-caption font-medium text-text-muted">Reason</p>
              <p className="text-body-sm text-text-secondary mt-1">{instructorProfile.rejectionReason}</p>
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
            <div className="mt-4 pt-4 border-t border-border-default">
              <LearnerProfileSection />
            </div>
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

          <AdminAccessPanel />

          <AccountActionsPanel />

        </div>

        {/* Instructor application — spans full grid width so the form is not confined to the narrow sidebar */}
        {(!user.roles.includes('ROLE_ADMIN') || user.availableProfiles.includes('INSTRUCTOR')) && (
          <div className="lg:col-span-2">
            <InstructorApplicationPanel />
          </div>
        )}

      </div>
    </div>
  );
}
