package com.judoclub.constantine.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.Set;

/** Refuses to start the prod profile with an unsafe configuration. */
@Component
@Profile("prod")
public class ProductionSafetyCheck implements InitializingBean {
    static final Set<String> KNOWN_DEFAULT_SECRETS = Set.of(
            "change-this-development-secret-change-before-production",
            "change-this-to-a-long-random-production-secret-at-least-32-chars",
            "dev-only-secret-not-for-production-0123456789abcdef",
            "test-secret-for-integration-tests-only-0123456789abcdef"
    );

    private final String jwtSecret;
    private final boolean secureCookie;

    public ProductionSafetyCheck(@Value("${app.jwt.secret:}") String jwtSecret,
                                 @Value("${app.jwt.secure-cookie}") boolean secureCookie) {
        this.jwtSecret = jwtSecret;
        this.secureCookie = secureCookie;
    }

    @Override
    public void afterPropertiesSet() {
        validate(jwtSecret, secureCookie);
    }

    static void validate(String jwtSecret, boolean secureCookie) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is required in production");
        }
        if (KNOWN_DEFAULT_SECRETS.contains(jwtSecret)) {
            throw new IllegalStateException("JWT_SECRET is a known default value; generate one with: openssl rand -base64 48");
        }
        if (jwtSecret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long");
        }
        if (!secureCookie) {
            throw new IllegalStateException("JWT_SECURE_COOKIE must be true in production (HTTPS only)");
        }
    }
}
