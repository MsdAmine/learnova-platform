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
        seedInstructor(
                "demo.instructor2@learnova.dev", "Demo Instructor Data",
                "Demo instructor account focused on data and business analytics courses.",
                "Data Analytics & Business Strategy",
                "8+ years working in business intelligence and analytics training.");
        seedInstructor(
                "demo.instructor3@learnova.dev", "Demo Instructor Management",
                "Demo instructor account focused on management and workplace skills courses.",
                "Project Management, Leadership & Communication",
                "10+ years managing teams and coaching first-time managers.");
        seedInstructor(
                "demo.instructor4@learnova.dev", "Demo Instructor Product",
                "Demo instructor account focused on security, product, and marketing courses.",
                "Cybersecurity, Product Design & Digital Marketing",
                "7+ years across security engineering and product/marketing roles.");
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
        seedInstructor(
                "demo.instructor@learnova.dev", "Demo Instructor",
                "Demo instructor account seeded for local development and testing.",
                "Software Engineering & Cloud/DevOps",
                "5+ years teaching online courses.");
    }

    private void seedInstructor(String email, String fullName, String bio, String expertise, String experience) {
        if (userRepository.existsByEmailIgnoreCase(email)) {
            return;
        }

        User user = newUser(fullName, email, RoleName.ROLE_LEARNER, RoleName.ROLE_INSTRUCTOR);
        user.attachLearnerProfile(LearnerProfile.builder().displayName(fullName).build());
        user.attachInstructorProfile(
                InstructorProfile.builder()
                        .bio(bio)
                        .expertise(expertise)
                        .experience(experience)
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
