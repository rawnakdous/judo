package com.judoclub.constantine;

import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** 20 attempts per IP and 15 failed logins per e-mail per 10 minutes, then 429. */
class LoginRateLimitIntegrationTest extends AbstractIntegrationTest {

    @BeforeEach
    void user() {
        data.userIfMissing("amina@club.dz", "Password123!");
    }

    private ResultActions login(String ip, String email, String password) throws Exception {
        return mockMvc.perform(post("/api/auth/login")
                .with(request -> { request.setRemoteAddr(ip); return request; })
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", password))));
    }

    @Test
    void twentyFirstAttemptFromSameIpReturns429() throws Exception {
        for (int i = 0; i < 20; i++) {
            login("10.0.0.1", "user" + i + "@club.dz", "wrong-password").andExpect(status().isUnauthorized());
        }
        login("10.0.0.1", "amina@club.dz", "Password123!")
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(jsonPath("$.status").value(429))
                .andExpect(jsonPath("$.message").value("Trop de tentatives, réessayez plus tard"));

        // another IP is unaffected
        login("10.0.0.2", "amina@club.dz", "Password123!").andExpect(status().isOk());
    }

    @Test
    void sixteenthAttemptAfter15FailuresForSameEmailReturns429EvenWithCorrectPassword() throws Exception {
        for (int i = 0; i < 15; i++) {
            // spread across IPs so only the e-mail limit applies
            login("10.0.1." + i, "amina@club.dz", "wrong-password").andExpect(status().isUnauthorized());
        }
        login("10.0.2.1", "AMINA@club.dz", "Password123!").andExpect(status().isTooManyRequests());
    }

    @Test
    void successfulLoginResetsEmailFailures() throws Exception {
        for (int i = 0; i < 14; i++) {
            login("10.0.3." + i, "amina@club.dz", "wrong-password").andExpect(status().isUnauthorized());
        }
        login("10.0.4.1", "amina@club.dz", "Password123!").andExpect(status().isOk());
        for (int i = 0; i < 14; i++) {
            login("10.0.5." + i, "amina@club.dz", "wrong-password").andExpect(status().isUnauthorized());
        }
        login("10.0.6.1", "amina@club.dz", "Password123!").andExpect(status().isOk());
    }

    @Test
    void registerCountsAgainstTheIpLimit() throws Exception {
        for (int i = 0; i < 20; i++) {
            login("10.0.7.1", "nobody@club.dz", "wrong-password");
        }
        mockMvc.perform(post("/api/auth/register")
                        .with(request -> { request.setRemoteAddr("10.0.7.1"); return request; })
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B", "email", "new@club.dz", "password", "Password123!"))))
                .andExpect(status().isTooManyRequests());
    }
}
