package com.learnova.learnova_backend.security;

import com.learnova.learnova_backend.user.entity.AccountStatus;
import com.learnova.learnova_backend.user.entity.User;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.MalformedJwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

/**
 * Unit tests for JwtAuthenticationFilter exception-handling contract.
 *
 * Expected failure cases (JwtException, UsernameNotFoundException) must be caught
 * and converted to anonymous access so Spring Security can return 401.
 *
 * Unexpected infrastructure failures (DataAccessException, connection errors, etc.)
 * must NOT be swallowed: they should propagate so the servlet container returns 500.
 */
@ExtendWith(MockitoExtension.class)
class JwtAuthenticationFilterUnitTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void cleanSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ── Test 1: No Authorization header ──────────────────────────────────────

    @Test
    void noAuthorizationHeader_proceedsWithoutInvokingJwtService() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(jwtService);
        verifyNoInteractions(userDetailsService);
    }

    // ── Test 2: Malformed / invalid JWT ──────────────────────────────────────

    @Test
    void malformedToken_clearsContextAndContinuesUnauthenticated() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer this.is.not.a.valid.jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.extractUsername("this.is.not.a.valid.jwt"))
                .thenThrow(new MalformedJwtException("bad token"));

        filter.doFilter(request, response, chain);

        // Filter chain must continue (Spring Security then returns 401 on protected endpoints)
        verify(chain).doFilter(request, response);
        verifyNoInteractions(userDetailsService);
    }

    @Test
    void expiredToken_clearsContextAndContinuesUnauthenticated() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer an.expired.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.extractUsername("an.expired.token"))
                .thenThrow(new JwtException("JWT expired"));

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    // ── Test 3: User deleted after token was issued ───────────────────────────

    @Test
    void userNotFound_clearsContextAndContinuesUnauthenticated() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer token.for.deleted.user");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.extractUsername("token.for.deleted.user")).thenReturn("ghost@example.com");
        when(userDetailsService.loadUserByUsername("ghost@example.com"))
                .thenThrow(new UsernameNotFoundException("User not found"));

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }

    // ── Test 4: Suspended / disabled user with a structurally valid token ────────
    //
    // isEnabled()        returns false for DISABLED and SUSPENDED
    // isAccountNonLocked() returns false for SUSPENDED
    //
    // The filter must not set authentication for either state. The security context
    // stays empty so Spring Security returns 401 when the request hits a protected endpoint.

    @Test
    void suspendedUser_validToken_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.but.suspended");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        User user = User.builder()
                .id(2L)
                .fullName("Suspended User")
                .email("suspended@example.com")
                .passwordHash("hash")
                .accountStatus(AccountStatus.SUSPENDED)
                .build();
        CustomUserDetails suspendedDetails = new CustomUserDetails(user);

        when(jwtService.extractUsername("valid.but.suspended")).thenReturn("suspended@example.com");
        when(userDetailsService.loadUserByUsername("suspended@example.com")).thenReturn(suspendedDetails);
        when(jwtService.isTokenValid("valid.but.suspended", suspendedDetails)).thenReturn(true);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    @Test
    void disabledUser_validToken_doesNotSetAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.but.disabled");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        User user = User.builder()
                .id(3L)
                .fullName("Disabled User")
                .email("disabled@example.com")
                .passwordHash("hash")
                .accountStatus(AccountStatus.DISABLED)
                .build();
        CustomUserDetails disabledDetails = new CustomUserDetails(user);

        when(jwtService.extractUsername("valid.but.disabled")).thenReturn("disabled@example.com");
        when(userDetailsService.loadUserByUsername("disabled@example.com")).thenReturn(disabledDetails);
        when(jwtService.isTokenValid("valid.but.disabled", disabledDetails)).thenReturn(true);

        filter.doFilter(request, response, chain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(chain).doFilter(request, response);
    }

    // ── Test 5: Unexpected infrastructure failure ─────────────────────────────
    //
    // A DataAccessException, connection timeout, or any other unexpected RuntimeException
    // during user lookup must NOT be swallowed into anonymous access.
    // It must propagate so the container returns HTTP 500, preserving the distinction
    // between "your session is invalid" (401) and "our server failed" (500).

    @Test
    void infrastructureFailure_duringUserLookup_propagatesException_doesNotAdvanceChain()
            throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer syntactically.valid.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        when(jwtService.extractUsername("syntactically.valid.token")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com"))
                .thenThrow(new RuntimeException("Database connection refused"));

        assertThrows(RuntimeException.class, () -> filter.doFilter(request, response, chain));

        // The chain must NOT have been called: the request must not reach the endpoint
        // as if the user were simply unauthenticated.
        verify(chain, never()).doFilter(any(), any());
    }
}
