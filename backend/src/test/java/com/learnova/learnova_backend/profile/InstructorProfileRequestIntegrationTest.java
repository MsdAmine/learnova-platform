package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.profile.dto.InstructorProfileRequest;
import com.learnova.learnova_backend.profile.entity.InstructorApprovalStatus;
import com.learnova.learnova_backend.profile.repository.InstructorProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstructorProfileRequestIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InstructorProfileRepository instructorProfileRepository;

    @Test
    void shouldCreateInstructorProfileRequestWithPendingStatus() throws Exception {
        String token = registerAndLogin("instructor.request@example.com", "password123");

        InstructorProfileRequest request = new InstructorProfileRequest(
                "I am a software engineering instructor.",
                "Java, Spring Boot, Backend Development",
                "3 years of tutoring and project mentoring.",
                "I want to teach practical backend engineering."
        );

        String response = mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.approvalStatus").value("PENDING"))
                .andExpect(jsonPath("$.bio").value("I am a software engineering instructor."))
                .andExpect(jsonPath("$.expertise").value("Java, Spring Boot, Backend Development"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        Long userId = json.get("userId").asLong();

        var instructorProfile = instructorProfileRepository.findByUserId(userId);

        assertThat(instructorProfile).isPresent();
        assertThat(instructorProfile.get().getApprovalStatus())
                .isEqualTo(InstructorApprovalStatus.PENDING);
    }

    @Test
    void shouldRejectDuplicateInstructorProfileRequest() throws Exception {
        String token = registerAndLogin("duplicate.instructor@example.com", "password123");

        InstructorProfileRequest request = validRequest();

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectInstructorProfileRequestWithoutAuthentication() throws Exception {
        InstructorProfileRequest request = validRequest();

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectInvalidInstructorProfileRequest() throws Exception {
        String token = registerAndLogin("invalid.instructor@example.com", "password123");

        InstructorProfileRequest request = new InstructorProfileRequest(
                "",
                "",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnMyInstructorProfileRequest() throws Exception {
        String token = registerAndLogin("my.instructor.profile@example.com", "password123");

        InstructorProfileRequest request = validRequest();

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/instructor-profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvalStatus").value("PENDING"))
                .andExpect(jsonPath("$.expertise").value("Java, Spring Boot"));
    }

    @Test
    void shouldExposeInstructorApprovalStatusInCurrentUserResponse() throws Exception {
        String token = registerAndLogin("current.with.instructor.request@example.com", "password123");

        mockMvc.perform(post("/api/v1/instructor-profile/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.instructorApprovalStatus").value("PENDING"))
                .andExpect(jsonPath("$.availableProfiles[0]").value("LEARNER"));
    }

    private InstructorProfileRequest validRequest() {
        return new InstructorProfileRequest(
                "I teach programming and software engineering.",
                "Java, Spring Boot",
                "I have experience mentoring students on backend projects.",
                "I want to help learners build real projects."
        );
    }

    private String registerAndLogin(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "Massine Amakhtari",
                email,
                password
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

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