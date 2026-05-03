package com.learnova.learnova_backend.profile.service;

import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class LearnerProfileServiceTest {

    @Autowired
    private LearnerProfileService learnerProfileService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LearnerProfileRepository learnerProfileRepository;

    @Test
    void shouldPreventDuplicateLearnerProfiles() {
        User user = User.builder()
                .fullName("Massine Amakhtari")
                .email("duplicate.profile@example.com")
                .passwordHash("hashed-password")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        User savedUser = userRepository.save(user);

        learnerProfileService.createDefaultProfileFor(savedUser);

        assertThatThrownBy(() -> learnerProfileService.createDefaultProfileFor(savedUser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Learner profile already exists");
    }
}