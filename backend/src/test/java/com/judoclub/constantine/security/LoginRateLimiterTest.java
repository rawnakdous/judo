package com.judoclub.constantine.security;

import com.judoclub.constantine.exception.TooManyRequestsException;
import org.junit.jupiter.api.Test;

import java.time.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginRateLimiterTest {

    /** Mutable test clock. */
    static class TestClock extends Clock {
        Instant now = Instant.parse("2026-12-01T10:00:00Z");
        void advance(Duration d) { now = now.plus(d); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }

    private final TestClock clock = new TestClock();
    private final LoginRateLimiter limiter = new LoginRateLimiter(20, 15, Duration.ofMinutes(10), clock);

    @Test
    void allows20AttemptsPerIpThenBlocksWithRetryAfter() {
        for (int i = 0; i < 20; i++) {
            limiter.acquireIp("1.2.3.4");
            clock.advance(Duration.ofSeconds(10));
        }
        assertThatThrownBy(() -> limiter.acquireIp("1.2.3.4"))
                .isInstanceOfSatisfying(TooManyRequestsException.class, e -> {
                    assertThat(e.getMessage()).isEqualTo("Trop de tentatives, réessayez plus tard");
                    // oldest attempt was 200 s ago -> it expires in 400 s
                    assertThat(e.getRetryAfter()).isEqualTo(Duration.ofSeconds(400));
                });
        assertThatCode(() -> limiter.acquireIp("5.6.7.8")).doesNotThrowAnyException();
    }

    @Test
    void ipWindowSlides() {
        for (int i = 0; i < 20; i++) limiter.acquireIp("1.2.3.4");
        clock.advance(Duration.ofMinutes(10).plusSeconds(1));
        assertThatCode(() -> limiter.acquireIp("1.2.3.4")).doesNotThrowAnyException();
    }

    @Test
    void blockedAttemptsDoNotExtendTheBlock() {
        for (int i = 0; i < 20; i++) limiter.acquireIp("1.2.3.4");
        for (int i = 0; i < 50; i++) {
            assertThatThrownBy(() -> limiter.acquireIp("1.2.3.4")).isInstanceOf(TooManyRequestsException.class);
        }
        clock.advance(Duration.ofMinutes(10).plusSeconds(1));
        assertThatCode(() -> limiter.acquireIp("1.2.3.4")).doesNotThrowAnyException();
    }

    @Test
    void fifteenFailuresPerEmailThenBlockedCaseInsensitive() {
        for (int i = 0; i < 14; i++) limiter.recordFailure("Amina@Club.dz");
        assertThatCode(() -> limiter.checkEmail("amina@club.dz")).doesNotThrowAnyException();
        limiter.recordFailure("amina@club.dz");
        assertThatThrownBy(() -> limiter.checkEmail(" AMINA@club.dz ")).isInstanceOf(TooManyRequestsException.class);
        assertThatCode(() -> limiter.checkEmail("other@club.dz")).doesNotThrowAnyException();

        clock.advance(Duration.ofMinutes(10).plusSeconds(1));
        assertThatCode(() -> limiter.checkEmail("amina@club.dz")).doesNotThrowAnyException();
    }

    @Test
    void successClearsEmailFailures() {
        for (int i = 0; i < 14; i++) limiter.recordFailure("amina@club.dz");
        limiter.recordSuccess("amina@club.dz");
        limiter.recordFailure("amina@club.dz");
        assertThatCode(() -> limiter.checkEmail("amina@club.dz")).doesNotThrowAnyException();
    }
}
