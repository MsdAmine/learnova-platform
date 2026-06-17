package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import com.learnova.learnova_backend.user.entity.Role;
import com.learnova.learnova_backend.user.entity.RoleName;
import com.learnova.learnova_backend.user.entity.User;
import com.learnova.learnova_backend.user.repository.RoleRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstructorProfileUpdateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InstructorProfileRepository instructorProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void approvedInstructorCanUpdateOwnInstructorProfile() throws Exception {
        String token = createApprovedInstructorAndLogin("instructor.update@example.com", "password123");

        String requestBody = """
                {
                  "bio": "Updated bio for teaching.",
                  "expertise": "Java, Spring Boot, React",
                  "experience": "5 years of mentoring.",
                  "motivation": "I love helping learners grow."
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Updated bio for teaching."))
                .andExpect(jsonPath("$.expertise").value("Java, Spring Boot, React"))
                .andExpect(jsonPath("$.experience").value("5 years of mentoring."))
                .andExpect(jsonPath("$.motivation").value("I love helping learners grow."));
    }

    @Test
    void nonInstructorCannotUpdateInstructorProfile() throws Exception {
        String token = registerAndLogin("learner.cannot.update.instructor@example.com", "password123");

        String requestBody = """
                {
                  "bio": "Trying to sneak an update in."
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedInstructorProfileUpdateReturnsUnauthorized() throws Exception {
        String requestBody = """
                {
                  "bio": "Anonymous update attempt."
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void instructorProfileUpdateValidationFailureReturnsBadRequest() throws Exception {
        String token = createApprovedInstructorAndLogin("instructor.invalid.update@example.com", "password123");

        String requestBody = """
                {
                  "bio": "   "
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingInstructorProfileReturnsNotFound() throws Exception {
        String email = "instructor.role.no.profile@example.com";
        String password = "password123";
        String token = registerAndLogin(email, password);

        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        Role instructorRole = roleRepository.findByName(RoleName.ROLE_INSTRUCTOR)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_INSTRUCTOR).build()));
        user.addRole(instructorRole);
        userRepository.save(user);

        String requestBody = """
                {
                  "bio": "Should not apply, profile does not exist."
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isNotFound());
    }

    @Test
    void updatedInstructorProfileDataPersistsAndCanBeFetchedAgain() throws Exception {
        String token = createApprovedInstructorAndLogin("instructor.persist@example.com", "password123");

        String requestBody = """
                {
                  "bio": "Persisted instructor bio.",
                  "expertise": "Persisted expertise"
                }
                """;

        mockMvc.perform(patch("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bio").value("Persisted instructor bio."))
                .andExpect(jsonPath("$.expertise").value("Persisted expertise"));

        String email = "instructor.persist@example.com";
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        var profile = instructorProfileRepository.findByUserId(user.getId());
        assertThat(profile).isPresent();
        assertThat(profile.get().getBio()).isEqualTo("Persisted instructor bio.");
        assertThat(profile.get().getExpertise()).isEqualTo("Persisted expertise");
    }

    private String createApprovedInstructorAndLogin(String email, String password) throws Exception {
        String token = registerAndLogin(email, password);

        InstructorProfileRequest request = new InstructorProfileRequest(
                "I teach software engineering.",
                "Java, Spring Boot",
                "I have mentoring experience.",
                "I want to help learners."
        );

        String response = mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        Long profileId = json.get("id").asLong();

        String adminToken = createAdminAndLogin("admin." + email, password);

        mockMvc.perform(post("/api/v1/admin/instructor-profiles/{profileId}/approve", profileId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        return login(email, password);
    }

    private String createAdminAndLogin(String email, String password) throws Exception {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));
        Role learnerRole = roleRepository.findByName(RoleName.ROLE_LEARNER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_LEARNER).build()));

        User admin = User.builder()
                .fullName("Admin User")
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .build();

        admin.addRole(learnerRole);
        admin.addRole(adminRole);
        userRepository.save(admin);

        return login(email, password);
    }

    private String registerAndLogin(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Massine Amakhtari", email, password);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        return login(email, password);
    }

    private String login(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest(email, password);

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(loginResponse);
        return json.get("accessToken").asText();
    }
}
