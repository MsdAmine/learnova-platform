package com.learnova.learnova_backend.common.config;

import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.entity.InstructorProfile;
import com.learnova.learnova_backend.profile.entity.LearnerProfile;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InstructorProfileRepository instructorProfileRepository;
    private final LearnerProfileRepository learnerProfileRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting Learnova database initialization...");

        // 1. Seed Roles if empty
        if (roleRepository.count() == 0) {
            log.info("Seeding default roles...");
            roleRepository.saveAll(List.of(
                    Role.builder().name(RoleName.ROLE_LEARNER).build(),
                    Role.builder().name(RoleName.ROLE_INSTRUCTOR).build(),
                    Role.builder().name(RoleName.ROLE_ADMIN).build()
            ));
        }

        // 2. Seed Categories if empty
        if (categoryRepository.count() == 0) {
            log.info("Seeding default course categories...");
            categoryRepository.saveAll(List.of(
                    Category.builder().name("Development").description("Software engineering and coding").build(),
                    Category.builder().name("Business").description("Finance, management, and startups").build(),
                    Category.builder().name("Design").description("UI/UX graphic design and multimedia").build(),
                    Category.builder().name("Marketing").description("Digital marketing and SEO optimization").build()
            ));
        }

        // Fetch roles to assign to users
        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseThrow(() -> new RuntimeException("Instructor role not found"));
        Role learnerRole = roleRepository.findByName(RoleName.ROLE_LEARNER)
                .orElseThrow(() -> new RuntimeException("Learner role not found"));

        // 3. Seed Test Instructor
        String instructorEmail = "instructor@learnova.com";
        if (!userRepository.existsByEmailIgnoreCase(instructorEmail)) {
            log.info("Creating default approved instructor test account...");

            User instructorUser = User.builder()
                    .email(instructorEmail)
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .fullName("Dr. Alex Instructor")
                    .accountStatus(AccountStatus.ACTIVE)
                    .roles(new HashSet<>(Set.of(instructorRole)))
                    .build();

            instructorUser = userRepository.save(instructorUser);

            InstructorProfile profile = InstructorProfile.builder()
                    .user(instructorUser)
                    .bio("Expert software architect and computer science professor.")
                    .expertise("Software Engineering and Architecture")
                    .approvalStatus(InstructorApprovalStatus.APPROVED)
                    .build();

            instructorProfileRepository.save(profile);
        }

        // 4. Seed Test Learner
        String learnerEmail = "learner@learnova.com";
        if (!userRepository.existsByEmailIgnoreCase(learnerEmail)) {
            log.info("Creating default learner test account...");

            User learnerUser = User.builder()
                    .email(learnerEmail)
                    .passwordHash(passwordEncoder.encode("Password123!"))
                    .fullName("Amine Learner")
                    .accountStatus(AccountStatus.ACTIVE)
                    .roles(new HashSet<>(Set.of(learnerRole)))
                    .build();

            learnerUser = userRepository.save(learnerUser);

            LearnerProfile learnerProfile = LearnerProfile.builder()
                    .user(learnerUser)
                    .displayName("Amine Learner")
                    .bio("Passionate about learning new technologies.")
                    .build();

            learnerProfileRepository.save(learnerProfile);
        }

        log.info("Learnova database initialization complete.");
    }
}