package com.judoclub.constantine.exception;

import lombok.Getter;

import java.time.Duration;

/** Rate limit exceeded (HTTP 429). {@code retryAfter} feeds the Retry-After header. */
@Getter
public class TooManyRequestsException extends RuntimeException {
    private final Duration retryAfter;

    public TooManyRequestsException(Duration retryAfter) {
        super("Trop de tentatives, réessayez plus tard");
        this.retryAfter = retryAfter;
    }
}
