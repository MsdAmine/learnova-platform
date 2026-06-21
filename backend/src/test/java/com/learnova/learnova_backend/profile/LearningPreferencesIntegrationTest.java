package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.entity.Category;
import com.learnova.learnova_backend.course.repository.CategoryRepository;
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
class LearningPreferencesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    void unauthenticatedGetPreferencesReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/learner-profile/me/preferences"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedPutPreferencesReturnsUnauthorized() throws Exception {
        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void learnerWithNoPreferencesGetsDefaultEmptyResponse() throws Exception {
        String token = registerAndLogin("prefs.default@example.com");

        mockMvc.perform(get("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningGoal").doesNotExist())
                .andExpect(jsonPath("$.preferredLevel").doesNotExist())
                .andExpect(jsonPath("$.weeklyGoalMinutes").doesNotExist())
                .andExpect(jsonPath("$.preferredCategoryIds").isArray())
                .andExpect(jsonPath("$.preferredCategoryIds").isEmpty());
    }

    @Test
    void learnerCanSaveValidPreferencesAndTheyPersistOnGet() throws Exception {
        String token = registerAndLogin("prefs.valid@example.com");
        Long categoryId = saveCategory("Web Development");

        String requestBody = """
                {
                  "learningGoal": "CAREER_GROWTH",
                  "preferredLevel": "BEGINNER",
                  "weeklyGoalMinutes": 180,
                  "preferredCategoryIds": [%d]
                }
                """.formatted(categoryId);

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningGoal").value("CAREER_GROWTH"))
                .andExpect(jsonPath("$.preferredLevel").value("BEGINNER"))
                .andExpect(jsonPath("$.weeklyGoalMinutes").value(180))
                .andExpect(jsonPath("$.preferredCategoryIds[0]").value(categoryId));

        mockMvc.perform(get("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningGoal").value("CAREER_GROWTH"))
                .andExpect(jsonPath("$.preferredLevel").value("BEGINNER"))
                .andExpect(jsonPath("$.weeklyGoalMinutes").value(180))
                .andExpect(jsonPath("$.preferredCategoryIds[0]").value(categoryId));
    }

    @Test
    void learnerCanSavePreferencesWithEmptyCategoryList() throws Exception {
        String token = registerAndLogin("prefs.empty-cats@example.com");

        String requestBody = """
                {
                  "learningGoal": "HOBBY",
                  "preferredLevel": "ALL_LEVELS",
                  "weeklyGoalMinutes": 60,
                  "preferredCategoryIds": []
                }
                """;

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.preferredCategoryIds").isEmpty());
    }

    @Test
    void invalidLearningGoalEnumReturnsBadRequest() throws Exception {
        String token = registerAndLogin("prefs.invalid-goal@example.com");

        String requestBody = """
                {
                  "learningGoal": "NOT_A_REAL_GOAL"
                }
                """;

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void weeklyGoalMinutesBelowMinimumReturnsBadRequest() throws Exception {
        String token = registerAndLogin("prefs.too-low@example.com");

        String requestBody = """
                {
                  "weeklyGoalMinutes": 10
                }
                """;

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void weeklyGoalMinutesAboveMaximumReturnsBadRequest() throws Exception {
        String token = registerAndLogin("prefs.too-high@example.com");

        String requestBody = """
                {
                  "weeklyGoalMinutes": 5000
                }
                """;

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void nonExistentCategoryIdReturnsBadRequest() throws Exception {
        String token = registerAndLogin("prefs.bad-category@example.com");

        String requestBody = """
                {
                  "preferredCategoryIds": [999999]
                }
                """;

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void tooManyPreferredCategoriesReturnsBadRequest() throws Exception {
        String token = registerAndLogin("prefs.too-many-cats@example.com");

        StringBuilder ids = new StringBuilder();
        for (int i = 0; i < 9; i++) {
            Long categoryId = saveCategory("Category " + i + " " + token.hashCode());
            if (i > 0) ids.append(",");
            ids.append(categoryId);
        }

        String requestBody = "{\"preferredCategoryIds\": [" + ids + "]}";

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anotherLearnersPreferencesAreNotAffected() throws Exception {
        String tokenA = registerAndLogin("prefs.learner-a@example.com");
        String tokenB = registerAndLogin("prefs.learner-b@example.com");

        mockMvc.perform(put("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"learningGoal\": \"ACADEMIC\", \"weeklyGoalMinutes\": 300}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningGoal").doesNotExist())
                .andExpect(jsonPath("$.weeklyGoalMinutes").doesNotExist());

        mockMvc.perform(get("/api/v1/learner-profile/me/preferences")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learningGoal").value("ACADEMIC"))
                .andExpect(jsonPath("$.weeklyGoalMinutes").value(300));
    }

    private Long saveCategory(String name) {
        Category saved = categoryRepository.save(Category.builder().name(name).build());
        return saved.getId();
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
