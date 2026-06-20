import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../api/axios';
import {
  getMyInstructorProfile,
  updateMyInstructorProfile,
  type InstructorProfileResponse,
} from '../../../../api/profile';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { FormField, Input } from '../../../../components/ui/Input';
import { SettingsCard, InfoRow } from './shared';
import { textareaInputClass, type SettingsUser } from './settingsHelpers';

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

export function InstructorSection() {
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
      <SettingsCard
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
      </SettingsCard>
    );
  }

  if (status === 'PENDING') {
    return (
      <SettingsCard
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
      </SettingsCard>
    );
  }

  if (status === 'APPROVED') {
    const hasInstructorAccess = availableProfiles.includes('INSTRUCTOR');
    return (
      <SettingsCard
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
      </SettingsCard>
    );
  }

  if (status === 'REJECTED') {
    return (
      <SettingsCard
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
      </SettingsCard>
    );
  }

  return null;
}
