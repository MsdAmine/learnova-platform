export type ProfileType = 'LEARNER' | 'INSTRUCTOR';

export interface ProfileSwitchResponse {
    activeProfile: ProfileType;
    availableProfiles: ProfileType[];
}