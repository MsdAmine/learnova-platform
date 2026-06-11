package com.learnova.learnova_backend.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.learnova.learnova_backend.auth.dto.LoginRequest;
import com.learnova.learnova_backend.auth.dto.RegisterRequest;
import com.learnova.learnova_backend.user.entity.AccountStatus;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldLoginSuccessfullyAndReturnJwt() throws Exception {
        registerUser("massine@example.com", "password123");

        LoginRequest loginRequest = new LoginRequest(
                "massine@example.com",
                "password123"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.userId").exists())
                .andExpect(jsonPath("$.email").value("massine@example.com"))
                .andExpect(jsonPath("$.fullName").value("Massine Amakhtari"))
                .andExpect(jsonPath("$.roles").isArray())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        registerUser("invalid@example.com", "password123");

        LoginRequest loginRequest = new LoginRequest(
                "invalid@example.com",
                "wrong-password"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectUnknownEmail() throws Exception {
        LoginRequest loginRequest = new LoginRequest(
                "missing@example.com",
                "password123"
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectInvalidLoginRequest() throws Exception {
        LoginRequest loginRequest = new LoginRequest(
                "invalid-email",
                ""
        );

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUseJwtForAuthenticatedRequests() throws Exception {
        registerUser("jwt@example.com", "password123");

        LoginRequest loginRequest = new LoginRequest(
                "jwt@example.com",
                "password123"
        );

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(loginResponse);
        String token = json.get("accessToken").asText();

        assertThat(token).isNotBlank();

        mockMvc.perform(get("/api/v1/protected-test")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    // ── Account-status enforcement at login time ───────────────────────────────

    @Test
    void shouldRejectSuspendedUserLoginWithForbidden() throws Exception {
        registerUser("suspended.login@example.com", "password123");
        setAccountStatus("suspended.login@example.com", AccountStatus.SUSPENDED);

        LoginRequest loginRequest = new LoginRequest("suspended.login@example.com", "password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void shouldRejectDisabledUserLoginWithForbidden() throws Exception {
        registerUser("disabled.login@example.com", "password123");
        setAccountStatus("disabled.login@example.com", AccountStatus.DISABLED);

        LoginRequest loginRequest = new LoginRequest("disabled.login@example.com", "password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    @Test
    void shouldStillRejectInvalidPasswordForSuspendedUser() throws Exception {
        registerUser("suspended.wrongpw@example.com", "password123");
        setAccountStatus("suspended.wrongpw@example.com", AccountStatus.SUSPENDED);

        LoginRequest loginRequest = new LoginRequest("suspended.wrongpw@example.com", "wrong-password");

        // Account-status check runs before password check; result is still non-200
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().is4xxClientError())
                .andExpect(jsonPath("$.accessToken").doesNotExist());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void setAccountStatus(String email, AccountStatus status) {
        var user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setAccountStatus(status);
        userRepository.saveAndFlush(user);
    }

    private void registerUser(String email, String password) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "Massine Amakhtari",
                email,
                password
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());
    }
}