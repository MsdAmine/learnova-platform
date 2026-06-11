package com.learnova.learnova_backend.security;

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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that JWT tokens issued to users whose accounts are later suspended
 * or disabled are rejected with 401, not silently accepted.
 *
 * Policy: non-ACTIVE accounts do not establish authentication; the security
 * context stays empty and Spring Security returns 401 for protected endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AccountStatusSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    // ── Happy path ────────────────────────────────────────────────────────────

    @Test
    void activeUser_validJwt_canAccessCurrentUserEndpoint() throws Exception {
        String token = registerAndLogin("active.status@example.com", "password123");

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    // ── Suspended account ─────────────────────────────────────────────────────

    @Test
    void suspendedUser_validJwt_isRejectedWithUnauthorized() throws Exception {
        String token = registerAndLogin("suspended.status@example.com", "password123");

        var user = userRepository.findByEmailIgnoreCase("suspended.status@example.com").orElseThrow();
        user.setAccountStatus(AccountStatus.SUSPENDED);
        userRepository.saveAndFlush(user);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void suspendedUser_validJwt_isRejectedOnAdminEndpoint() throws Exception {
        String token = registerAndLogin("suspended.admin@example.com", "password123");

        var user = userRepository.findByEmailIgnoreCase("suspended.admin@example.com").orElseThrow();
        user.setAccountStatus(AccountStatus.SUSPENDED);
        userRepository.saveAndFlush(user);

        // Expect 401 (not authenticated), not 403 (role check never reached)
        mockMvc.perform(get("/api/v1/admin/instructor-profiles/pending")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // ── Disabled account ──────────────────────────────────────────────────────

    @Test
    void disabledUser_validJwt_isRejectedWithUnauthorized() throws Exception {
        String token = registerAndLogin("disabled.status@example.com", "password123");

        var user = userRepository.findByEmailIgnoreCase("disabled.status@example.com").orElseThrow();
        user.setAccountStatus(AccountStatus.DISABLED);
        userRepository.saveAndFlush(user);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // ── Role-based access still enforced for active users ─────────────────────

    @Test
    void activeUser_withoutAdminRole_isForbiddenOnAdminEndpoint() throws Exception {
        String token = registerAndLogin("learner.noadmin@example.com", "password123");

        mockMvc.perform(get("/api/v1/admin/instructor-profiles/pending")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
        String token = json.get("accessToken").asText();
        assertThat(token).isNotBlank();
        return token;
    }
}
