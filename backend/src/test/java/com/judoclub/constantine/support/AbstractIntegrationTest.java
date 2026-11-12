package com.judoclub.constantine.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.judoclub.constantine.security.LoginRateLimiter;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for integration tests: full Spring context + MockMvc against a real
 * PostgreSQL (Testcontainers) with the real Flyway migrations.
 *
 * <p>The container is a JVM-wide singleton so the cached Spring context stays valid
 * across test classes. Every table is truncated before each test.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(TestDataFactory.class)
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected TestDataFactory data;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private LoginRateLimiter loginRateLimiter;

    @Value("${app.jwt.cookie-name}")
    private String cookieName;

    @BeforeEach
    void resetRateLimits() {
        loginRateLimiter.reset(); // all MockMvc requests come from 127.0.0.1
    }

    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute("""
                truncate table notifications, user_event_registrations, combats, athletes,
                               tatamis, events, users restart identity cascade
                """);
    }

    /** Creates an admin (if needed), logs in through the real endpoint and returns the JWT cookie. */
    protected Cookie adminCookie() throws Exception {
        String email = "admin@test.local";
        String password = "AdminPass123!";
        data.adminIfMissing(email, password);
        return login(email, password);
    }

    /** Creates a regular user (if needed), logs in and returns the JWT cookie. */
    protected Cookie userCookie() throws Exception {
        String email = "user@test.local";
        String password = "UserPass123!";
        data.userIfMissing(email, password);
        return login(email, password);
    }

    protected Cookie login(String email, String password) throws Exception {
        var response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email, "password", password))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse();
        Cookie cookie = response.getCookie(cookieName);
        if (cookie == null || cookie.getValue().isBlank()) {
            throw new IllegalStateException("Login did not set the " + cookieName + " cookie");
        }
        return cookie;
    }

    protected String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
