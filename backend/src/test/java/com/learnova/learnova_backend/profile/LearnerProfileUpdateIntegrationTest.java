package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LearnerProfileUpdateIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private LearnerProfileRepository learnerProfileRepository;

    @Test
    void learnerCanUpdateOwnLearnerProfile() throws Exception {
        String token = registerAndLogin("learner.profile.update@example.com", "password123");

        String requestBody = """
                {
                  "displayName": "Massine A.",
                  "bio": "I love learning new things.",
                  "profileImageUrl": "https://example.com/avatar.png"
                }
                """;

        mockMvc.perform(patch("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Massine A."))
                .andExpect(jsonPath("$.bio").value("I love learning new things."))
                .andExpect(jsonPath("$.profileImageUrl").value("https://example.com/avatar.png"));
    }

    @Test
    void learnerProfileUpdateValidationFailureReturnsBadRequest() throws Exception {
        String token = registerAndLogin("learner.profile.invalid@example.com", "password123");

        String requestBody = """
                {
                  "displayName": "   "
                }
                """;

        mockMvc.perform(patch("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void learnerProfileUpdateOversizedFieldReturnsBadRequest() throws Exception {
        String token = registerAndLogin("learner.profile.oversized@example.com", "password123");

        String requestBody = "{\"bio\": \"" + "x".repeat(501) + "\"}";

        mockMvc.perform(patch("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticatedLearnerProfileUpdateReturnsUnauthorized() throws Exception {
        String requestBody = """
                {
                  "displayName": "Someone"
                }
                """;

        mockMvc.perform(patch("/api/v1/learner-profile/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updatedLearnerProfileDataPersistsAndCanBeFetchedAgain() throws Exception {
        String token = registerAndLogin("learner.profile.persist@example.com", "password123");

        String requestBody = """
                {
                  "displayName": "Persisted Name",
                  "bio": "Persisted bio."
                }
                """;

        mockMvc.perform(patch("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Persisted Name"))
                .andExpect(jsonPath("$.bio").value("Persisted bio."));

        String currentUserResponse = mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(currentUserResponse);
        Long userId = json.get("id").asLong();

        var profile = learnerProfileRepository.findByUserId(userId);
        assertThat(profile).isPresent();
        assertThat(profile.get().getDisplayName()).isEqualTo("Persisted Name");
        assertThat(profile.get().getBio()).isEqualTo("Persisted bio.");
    }

    @Test
    void unauthenticatedGetLearnerProfileReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/learner-profile/me"))
                .andExpect(status().isUnauthorized());
    }

    private String registerAndLogin(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Massine Amakhtari", email, password);

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
