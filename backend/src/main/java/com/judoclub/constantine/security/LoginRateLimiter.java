package com.judoclub.constantine.security;

import com.judoclub.constantine.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window limits for /api/auth/login and /api/auth/register (single instance, no Redis):
 * <ul>
 *   <li>at most {@code ipMaxAttempts} attempts per client IP per window;</li>
 *   <li>at most {@code emailMaxFailures} failed logins per e-mail per window (a success clears them).</li>
 * </ul>
 * Rejected (429) attempts are not counted, so a blocked client recovers as soon as the window slides.
 */
@Component
public class LoginRateLimiter {
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final int ipMaxAttempts;
    private final int emailMaxFailures;
    private final Duration window;
    private final Clock clock;

    private final Map<String, Deque<Instant>> attemptsByIp = new ConcurrentHashMap<>();
    private final Map<String, Deque<Instant>> failuresByEmail = new ConcurrentHashMap<>();

    @Autowired
    public LoginRateLimiter(@Value("${app.rate-limit.login.ip-max-attempts:20}") int ipMaxAttempts,
                            @Value("${app.rate-limit.login.email-max-failures:15}") int emailMaxFailures,
                            @Value("${app.rate-limit.login.window:10m}") Duration window) {
        this(ipMaxAttempts, emailMaxFailures, window, Clock.systemUTC());
    }

    LoginRateLimiter(int ipMaxAttempts, int emailMaxFailures, Duration window, Clock clock) {
        this.ipMaxAttempts = ipMaxAttempts;
        this.emailMaxFailures = emailMaxFailures;
        this.window = window;
        this.clock = clock;
    }

    /** Counts one attempt for this IP, or throws 429 if the IP already used its budget. */
    public void acquireIp(String ip) {
        Instant now = clock.instant();
        Deque<Instant> attempts = attemptsByIp.computeIfAbsent(ip, k -> new ArrayDeque<>());
        synchronized (attempts) {
            prune(attempts, now);
            if (attempts.size() >= ipMaxAttempts) {
                throw new TooManyRequestsException(retryAfter(attempts, now));
            }
            attempts.addLast(now);
        }
        evictIfTooLarge(attemptsByIp, now);
    }

    /** Throws 429 if this e-mail already has too many recent failed logins. */
    public void checkEmail(String email) {
        Deque<Instant> failures = failuresByEmail.get(normalize(email));
        if (failures == null) return;
        Instant now = clock.instant();
        synchronized (failures) {
            prune(failures, now);
            if (failures.size() >= emailMaxFailures) {
                throw new TooManyRequestsException(retryAfter(failures, now));
            }
        }
    }

    public void recordFailure(String email) {
        Instant now = clock.instant();
        Deque<Instant> failures = failuresByEmail.computeIfAbsent(normalize(email), k -> new ArrayDeque<>());
        synchronized (failures) {
            prune(failures, now);
            failures.addLast(now);
        }
        evictIfTooLarge(failuresByEmail, now);
    }

    public void recordSuccess(String email) {
        failuresByEmail.remove(normalize(email));
    }

    /** Clears all counters (tests). */
    public void reset() {
        attemptsByIp.clear();
        failuresByEmail.clear();
    }

    private void prune(Deque<Instant> events, Instant now) {
        Instant cutoff = now.minus(window);
        while (!events.isEmpty() && !events.peekFirst().isAfter(cutoff)) {
            events.pollFirst();
        }
    }

    private Duration retryAfter(Deque<Instant> events, Instant now) {
        Duration wait = Duration.between(now, events.peekFirst().plus(window));
        return wait.isNegative() ? Duration.ZERO : wait;
    }

    private void evictIfTooLarge(Map<String, Deque<Instant>> map, Instant now) {
        if (map.size() <= MAX_TRACKED_KEYS) return;
        map.entrySet().removeIf(entry -> {
            synchronized (entry.getValue()) {
                prune(entry.getValue(), now);
                return entry.getValue().isEmpty();
            }
        });
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
