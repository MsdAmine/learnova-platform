package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LearnerOnboardingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void unauthenticatedOnboardingCompleteReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedLearnerProfileGetReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/learner-profile/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void newLearnerHasIncompleteOnboardingByDefault() throws Exception {
        String token = registerAndLogin("onboarding.default@example.com");

        mockMvc.perform(get("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(false))
                .andExpect(jsonPath("$.onboardingCompletedAt").doesNotExist());

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learnerOnboardingCompleted").value(false));
    }

    @Test
    void learnerCanSavePreferencesAndCompleteOnboarding() throws Exception {
        String token = registerAndLogin("onboarding.complete@example.com");

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learningGoal\": \"SKILL_UP\", \"weeklyGoalMinutes\": 120}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true))
                .andExpect(jsonPath("$.onboardingCompletedAt").exists());
    }

    @Test
    void onboardingCompletionWithNoOptionalPreferencesStillSucceeds() throws Exception {
        String token = registerAndLogin("onboarding.no-prefs@example.com");

        mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    @Test
    void onboardingCompletionPersistsAfterRefetch() throws Exception {
        String token = registerAndLogin("onboarding.persist@example.com");

        mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learnerOnboardingCompleted").value(true));
    }

    @Test
    void completingOnboardingTwiceIsIdempotentAndKeepsFirstTimestamp() throws Exception {
        String token = registerAndLogin("onboarding.idempotent@example.com");

        String firstResponse = mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String firstCompletedAt = objectMapper.readTree(firstResponse).get("onboardingCompletedAt").asText();

        String secondResponse = mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String secondCompletedAt = objectMapper.readTree(secondResponse).get("onboardingCompletedAt").asText();

        org.assertj.core.api.Assertions.assertThat(secondCompletedAt).isEqualTo(firstCompletedAt);
    }

    @Test
    void anotherLearnersOnboardingStatusIsNotAffected() throws Exception {
        String tokenA = registerAndLogin("onboarding.learner-a@example.com");
        String tokenB = registerAndLogin("onboarding.learner-b@example.com");

        mockMvc.perform(post("/api/v1/learner-profile/me/onboarding/complete")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(false));

        mockMvc.perform(get("/api/v1/learner-profile/me")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingCompleted").value(true));
    }

    private String registerAndLogin(String email) throws Exception {
        String password = "password123";
        RegisterRequest registerRequest = new RegisterRequest("Test Learner", email, password);

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
