package com.judoclub.constantine.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProductionSafetyCheckTest {
    private static final String STRONG = "Qm9uam91ci1sZS1tb25kZS1jZWNpLWVzdC11bi1zZWNyZXQtZm9ydA==";

    @Test
    void rejectsMissingDefaultShortSecretsAndInsecureCookie() {
        assertThatThrownBy(() -> ProductionSafetyCheck.validate("", true)).hasMessageContaining("required");
        assertThatThrownBy(() -> ProductionSafetyCheck.validate(null, true)).hasMessageContaining("required");
        assertThatThrownBy(() -> ProductionSafetyCheck.validate("change-this-to-a-long-random-production-secret-at-least-32-chars", true))
                .hasMessageContaining("known default");
        assertThatThrownBy(() -> ProductionSafetyCheck.validate("too-short-secret", true)).hasMessageContaining("32 bytes");
        assertThatThrownBy(() -> ProductionSafetyCheck.validate(STRONG, false)).hasMessageContaining("JWT_SECURE_COOKIE");
        assertThatCode(() -> ProductionSafetyCheck.validate(STRONG, true)).doesNotThrowAnyException();
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(ProductionSafetyCheck.class);

    @Test
    void prodProfileFailsToStartWithWeakSecret() {
        runner.withPropertyValues("spring.profiles.active=prod", "app.jwt.secret=weak", "app.jwt.secure-cookie=true")
                .run(context -> assertThat(context).hasFailed()
                        .getFailure().rootCause().hasMessageContaining("32 bytes"));
    }

    @Test
    void prodProfileStartsWithStrongSecret() {
        runner.withPropertyValues("spring.profiles.active=prod", "app.jwt.secret=" + STRONG, "app.jwt.secure-cookie=true")
                .run(context -> assertThat(context).hasNotFailed().hasSingleBean(ProductionSafetyCheck.class));
    }

    @Test
    void checkIsInactiveOutsideProd() {
        runner.withPropertyValues("spring.profiles.active=dev", "app.jwt.secret=weak", "app.jwt.secure-cookie=false")
                .run(context -> assertThat(context).hasNotFailed().doesNotHaveBean(ProductionSafetyCheck.class));
    }
}
