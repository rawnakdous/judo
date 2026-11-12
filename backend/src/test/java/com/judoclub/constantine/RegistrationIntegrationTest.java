package com.judoclub.constantine;

import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Registration open (test profile sets app.registration.enabled=true). */
class RegistrationIntegrationTest extends AbstractIntegrationTest {

    @Test
    void registerCreatesUserRoleAndLogsIn() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "Amina", "lastName", "Bensalem",
                                "email", "Amina@Example.dz", "password", "Password123!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("amina@example.dz"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(header().string("Set-Cookie", containsString("jcc_token=")));
    }
}
