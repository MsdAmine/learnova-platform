import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  getMyLearnerProfile,
  updateMyLearnerProfile,
  uploadLearnerProfileImage,
  type LearnerProfileResponse,
} from '../../../../api/profile';
import { Avatar } from '../../../../components/ui/Avatar';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { FormField, Input } from '../../../../components/ui/Input';
import type { ProfileType } from '../../../../types/profile';
import { SettingsCard, InfoRow } from './shared';
import { textareaInputClass, profileVariant, profileLabel, type SettingsUser } from './settingsHelpers';

const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateImageFile(file: File, maxBytes: number): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPG, PNG, or WEBP image.';
  }
  if (file.size > maxBytes) {
    return `Image must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller.`;
  }
  return null;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
  ) {
    return (err as { response: { data: { message: string } } }).response.data.message;
  }
  return fallback;
}

interface LearnerProfileFormErrors {
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
}

interface ProfileSectionProps {
  user: SettingsUser;
  activeProfile: ProfileType | null;
}

export function ProfileSection({ user, activeProfile }: ProfileSectionProps) {
  const [profile, setProfile] = useState<LearnerProfileResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<LearnerProfileFormErrors>({});
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const hintError = validateImageFile(file, MAX_PROFILE_IMAGE_BYTES);
    if (hintError) {
      setImageUploadError(hintError);
      return;
    }

    setImageUploadError(null);
    setIsUploadingImage(true);
    try {
      const updated = await uploadLearnerProfileImage(file);
      setProfile(updated);
    } catch (err) {
      setImageUploadError(extractErrorMessage(err, 'We could not upload your photo. Please try again.'));
    } finally {
      setIsUploadingImage(false);
    }
  }

  const displayLabel = profile?.displayName || user.fullName || user.email;

  return (
    <div className="flex flex-col gap-4">
      {/* Profile summary */}
      <div className="flex items-center gap-4 bg-surface border border-border-default rounded-lg p-4">
        <Avatar src={profile?.profileImageUrl ?? undefined} name={displayLabel} size={56} />
        <div className="flex-1 min-w-0">
          <p className="text-body font-semibold text-text-primary truncate">{displayLabel}</p>
          <p className="text-body-sm text-text-secondary truncate">{user.email}</p>
          {activeProfile !== null && (
            <div className="mt-1.5">
              <Badge variant={profileVariant(activeProfile)}>{profileLabel(activeProfile)}</Badge>
            </div>
          )}
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              aria-label="Choose profile image"
              onChange={handleImageChange}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={isUploadingImage}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile photo"
            >
              Upload photo
            </Button>
            <p className="text-caption text-text-muted mt-1">JPG, PNG, or WEBP. Max 2MB.</p>
            {imageUploadError && (
              <p className="text-caption text-error mt-1" role="alert">{imageUploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal information */}
      <SettingsCard id="profile-info-heading" heading="Personal information">
        <dl className="divide-y divide-border-default mt-4">
          <InfoRow label="Full name">{user.fullName || 'Not set'}</InfoRow>
          <InfoRow label="Email">{user.email}</InfoRow>
        </dl>

        {loadError && (
          <p className="text-body-sm text-error mt-3" role="alert">{loadError}</p>
        )}

        {!loadError && !profile && (
          <p className="text-body-sm text-text-secondary mt-4">Loading profile details…</p>
        )}

        {!loadError && profile && !isEditing && (
          <div className="mt-2 pt-2 border-t border-border-default">
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
        )}

        {!loadError && profile && isEditing && (
          <form onSubmit={handleSubmit} noValidate className="mt-4 pt-4 border-t border-border-default grid gap-4">
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
        )}
      </SettingsCard>
    </div>
  );
}
