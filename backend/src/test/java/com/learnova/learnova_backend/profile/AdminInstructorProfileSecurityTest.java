package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminInstructorProfileSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void adminCanGetPendingInstructorProfiles() throws Exception {
        String adminToken = createAdminAndLogin("admin.get.pending@example.com", "password123");

        mockMvc.perform(get("/api/v1/admin/instructor-profiles/pending")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    void learnerGetsForbiddenOnAdminGetPendingProfiles() throws Exception {
        String learnerToken = registerAndLogin("learner.admin.attempt@example.com", "password123");

        mockMvc.perform(get("/api/v1/admin/instructor-profiles/pending")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestToAdminEndpointReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/admin/instructor-profiles/pending"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void learnerGetsForbiddenOnAdminApproveEndpoint() throws Exception {
        String learnerToken = registerAndLogin("learner.approve.attempt@example.com", "password123");

        mockMvc.perform(post("/api/v1/admin/instructor-profiles/999/approve")
                        .header("Authorization", "Bearer " + learnerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanApproveInstructorProfile() throws Exception {
        String adminToken = createAdminAndLogin("admin.approver@example.com", "password123");

        Long profileId = createInstructorRequest("instructor.to.approve@example.com", "password123");

        mockMvc.perform(post("/api/v1/admin/instructor-profiles/{profileId}/approve", profileId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    private Long createInstructorRequest(String email, String password) throws Exception {
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
        return json.get("id").asLong();
    }

    private String createAdminAndLogin(String email, String password) throws Exception {
        Role adminRole = roleRepository.findByName(RoleName.ROLE_ADMIN)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_ADMIN).build()
                ));

        Role learnerRole = roleRepository.findByName(RoleName.ROLE_LEARNER)
                .orElseGet(() -> roleRepository.save(
                        Role.builder().name(RoleName.ROLE_LEARNER).build()
                ));

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
        RegisterRequest registerRequest = new RegisterRequest("Test User", email, password);

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
