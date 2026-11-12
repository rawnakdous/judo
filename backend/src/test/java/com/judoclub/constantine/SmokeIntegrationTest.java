package com.judoclub.constantine;

import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SmokeIntegrationTest extends AbstractIntegrationTest {

    @Test
    void contextLoadsAndPublicEventsEndpointResponds() throws Exception {
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void factoryDataIsVisibleThroughTheApi() throws Exception {
        data.liveEvent();

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Championnat Test"))
                .andExpect(jsonPath("$[0].status").value("LIVE"));
    }

    @Test
    void adminCookieAuthenticatesAsAdmin() throws Exception {
        mockMvc.perform(get("/api/auth/me").cookie(adminCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@test.local"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void userCookieAuthenticatesAsUser() throws Exception {
        mockMvc.perform(get("/api/auth/me").cookie(userCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
