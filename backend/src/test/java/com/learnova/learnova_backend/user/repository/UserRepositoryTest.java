package com.learnova.learnova_backend.user.repository;

import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@ActiveProfiles("test")
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    void shouldSaveUserWithRole() {
        Role learnerRole = roleRepository.save(
                Role.builder()
                        .name(RoleName.ROLE_LEARNER)
                        .build()
        );

        User user = User.builder()
                .fullName("Massine Amakhtari")
                .email("massine@example.com")
                .passwordHash("hashed-password")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        user.addRole(learnerRole);

        User savedUser = userRepository.save(user);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getRoles()).hasSize(1);
        assertThat(savedUser.getRoles())
                .extracting(Role::getName)
                .contains(RoleName.ROLE_LEARNER);
    }

    @Test
    void shouldFindUserByEmailIgnoringCase() {
        User user = User.builder()
                .fullName("Test User")
                .email("test@example.com")
                .passwordHash("hashed-password")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        userRepository.save(user);

        assertThat(userRepository.findByEmailIgnoreCase("TEST@example.com"))
                .isPresent();
    }

    @Test
    void shouldCheckIfEmailExistsIgnoringCase() {
        User user = User.builder()
                .fullName("Test User")
                .email("existing@example.com")
                .passwordHash("hashed-password")
                .accountStatus(AccountStatus.ACTIVE)
                .build();

        userRepository.save(user);

        assertThat(userRepository.existsByEmailIgnoreCase("EXISTING@example.com"))
                .isTrue();
    }
}