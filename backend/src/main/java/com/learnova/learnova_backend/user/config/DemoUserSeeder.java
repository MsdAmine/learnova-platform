package com.learnova.learnova_backend.user.config;

import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds one ACTIVE user per role (learner, instructor, admin) so local dev and
 * agent-driven testing always have ready-to-use credentials without going through
 * registration/admin-approval. Credentials are documented in backend/.env.example.
 */
@Component
@RequiredArgsConstructor
@Order(2)
public class DemoUserSeeder implements CommandLineRunner {

    private static final String DEMO_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedLearner();
        seedInstructor();
        seedAdmin();
    }

    private void seedLearner() {
        String email = "demo.learner@learnova.dev";
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        User user = newUser("Demo Learner", email, RoleName.ROLE_LEARNER);
        user.attachLearnerProfile(LearnerProfile.builder().displayName("Demo Learner").build());
        userRepository.save(user);
    }

    private void seedInstructor() {
        String email = "demo.instructor@learnova.dev";
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        User user = newUser("Demo Instructor", email, RoleName.ROLE_LEARNER, RoleName.ROLE_INSTRUCTOR);
        user.attachLearnerProfile(LearnerProfile.builder().displayName("Demo Instructor").build());
        user.attachInstructorProfile(
                InstructorProfile.builder()
                        .bio("Demo instructor account seeded for local development and testing.")
                        .expertise("Software Engineering")
                        .experience("5+ years teaching online courses.")
                        .motivation("Seeded demo account.")
                        .approvalStatus(InstructorApprovalStatus.APPROVED)
                        .build()
        );
        userRepository.save(user);
    }

    private void seedAdmin() {
        String email = "demo.admin@learnova.dev";
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        User user = newUser("Demo Admin", email, RoleName.ROLE_LEARNER, RoleName.ROLE_ADMIN);
        user.attachLearnerProfile(LearnerProfile.builder().displayName("Demo Admin").build());
        userRepository.save(user);
    }

    private User newUser(String fullName, String email, RoleName... roleNames) {
        User user = User.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                .build();

        for (RoleName roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Role not seeded: " + roleName));
            user.addRole(role);
        }

        return user;
    }
}
