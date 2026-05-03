package com.learnova.learnova_backend.profile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.profile.repository.LearnerProfileRepository;
import com.learnova.learnova_backend.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class LearnerProfileRegistrationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LearnerProfileRepository learnerProfileRepository;

    @Test
    void shouldCreateLearnerProfileWhenUserRegisters() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Massine Amakhtari",
                "learner.profile@example.com",
                "password123"
        );

        String response = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(response);
        Long userId = json.get("id").asLong();

        var user = userRepository.findById(userId).orElseThrow();

        var learnerProfile = learnerProfileRepository.findByUserId(user.getId());

        assertThat(learnerProfile).isPresent();
        assertThat(learnerProfile.get().getUser().getId()).isEqualTo(user.getId());
        assertThat(learnerProfile.get().getDisplayName()).isEqualTo("Massine Amakhtari");
    }

    @Test
    void shouldNotCreateLearnerProfileWhenRegistrationFailsForDuplicateEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "First User",
                "duplicate.learner@example.com",
                "password123"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        long profileCountBeforeDuplicateAttempt = learnerProfileRepository.count();

        RegisterRequest duplicateRequest = new RegisterRequest(
                "Second User",
                "DUPLICATE.LEARNER@example.com",
                "password123"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(status().isConflict());

        assertThat(learnerProfileRepository.count())
                .isEqualTo(profileCountBeforeDuplicateAttempt);
    }
}