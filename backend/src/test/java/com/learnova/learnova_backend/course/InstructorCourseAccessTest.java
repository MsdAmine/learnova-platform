package com.learnova.learnova_backend.course;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.course.dto.CourseRequest;
import com.learnova.learnova_backend.course.entity.CourseLevel;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class InstructorCourseAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // CourseRequest fields: title, description, categoryId, level, thumbnailUrl

    @Test
    void learnerGetsForbiddenOnCourseCreation() throws Exception {
        String learnerToken = registerAndLogin("learner.course.attempt@example.com", "password123");

        // categoryId=1L and level are @NotNull — must be valid so Spring MVC passes
        // argument resolution before @PreAuthorize AOP fires
        CourseRequest request = new CourseRequest(
                "Introduction to Spring Boot",
                "Learn backend development with Spring Boot.",
                1L,
                CourseLevel.BEGINNER,
                null
        );

        mockMvc.perform(post("/api/v1/instructor/courses")
                        .header("Authorization", "Bearer " + learnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestToCourseCreationReturnsUnauthorized() throws Exception {
        // Security filter chain fires before DispatcherServlet, so body validity is irrelevant
        mockMvc.perform(post("/api/v1/instructor/courses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private String registerAndLogin(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest("Test User", email, password);

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
