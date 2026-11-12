package com.judoclub.constantine;

import com.judoclub.constantine.config.AdminBootstrap;
import com.judoclub.constantine.config.DataInitializer;
import com.judoclub.constantine.entity.Role;
import com.judoclub.constantine.repository.UserRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Seeding, admin bootstrap and auth cookie settings. */
class StartupSafetyIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ApplicationContext context;
    @Autowired
    private AdminBootstrap adminBootstrap;
    @Autowired
    private UserRepository users;

    @Test
    void demoSeederIsNotLoadedOutsideDevProfile() {
        assertThat(context.getBeansOfType(DataInitializer.class)).isEmpty();
    }

    @Test
    void bootstrapCreatesAdminOnlyWhenNoneExistsAndCredentialsAreSet() {
        assertThat(adminBootstrap.ensureAdmin("", "")).isFalse();
        assertThat(adminBootstrap.ensureAdmin("boss@club.dz", null)).isFalse();
        assertThat(users.existsByRole(Role.ADMIN)).isFalse();

        assertThat(adminBootstrap.ensureAdmin("Boss@Club.dz", "LongEnough1!")).isTrue();
        assertThat(users.findByEmailIgnoreCase("boss@club.dz").orElseThrow().getRole()).isEqualTo(Role.ADMIN);

        // second run (every restart): an admin exists, nothing happens even with other credentials
        assertThat(adminBootstrap.ensureAdmin("other@club.dz", "LongEnough1!")).isFalse();
        assertThat(users.count()).isEqualTo(1);
    }

    @Test
    void bootstrapRejectsShortPasswordAndExistingNonAdminEmail() {
        assertThatThrownBy(() -> adminBootstrap.ensureAdmin("boss@club.dz", "short")).hasMessageContaining("8 characters");
        data.userIfMissing("member@club.dz", "Password123!");
        assertThatThrownBy(() -> adminBootstrap.ensureAdmin("member@club.dz", "LongEnough1!")).hasMessageContaining("non-admin");
    }

    @Test
    void authCookieIsHttpOnlyLaxAndLivesAsLongAsTheJwt() throws Exception {
        data.userIfMissing("someone@test.local", "Password123!");
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "someone@test.local", "password", "Password123!"))))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", allOf(
                        containsString("jcc_token="),
                        containsString("Max-Age=3600"), // app.jwt.expiration-minutes=60 in the test profile
                        containsString("HttpOnly"),
                        containsString("SameSite=Lax"),
                        not(containsString("Secure")))));
    }
}
