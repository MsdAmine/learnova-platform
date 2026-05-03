package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.dto.ProfileSwitchRequest;
import com.learnova.learnova_backend.profile.dto.ProfileSwitchResponse;
import com.learnova.learnova_backend.profile.entity.ProfileType;
import com.learnova.learnova_backend.security.CustomUserDetails;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ProfileSwitchService {

    private final UserRepository userRepository;
    private final ProfileAccessService profileAccessService;

    @Transactional(readOnly = true)
    public ProfileSwitchResponse switchProfile(
            CustomUserDetails currentUser,
            ProfileSwitchRequest request
    ) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        ProfileType requestedProfile = request.profileType();

        if (!profileAccessService.canUseProfile(user, requestedProfile)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Requested profile is not available for this user"
            );
        }

        return new ProfileSwitchResponse(
                requestedProfile,
                profileAccessService.resolveAvailableProfiles(user)
        );
    }
}