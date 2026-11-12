package com.judoclub.constantine;

import com.judoclub.constantine.repository.UserRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Production default: public sign-up is closed, login still works. */
@TestPropertySource(properties = "app.registration.enabled=false")
class RegistrationClosedIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository users;

    @Test
    void registerReturns403AndCreatesNothing() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "Amina", "lastName", "Bensalem",
                                "email", "amina@example.dz", "password", "Password123!"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Les inscriptions sont fermées"))
                .andExpect(header().doesNotExist("Set-Cookie"));
        assertThat(users.count()).isZero();
    }

    @Test
    void adminLoginStillWorks() throws Exception {
        mockMvc.perform(get("/api/auth/me").cookie(adminCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }
}
