package com.judoclub.constantine.exception;

/** An action that is not allowed in the current configuration/state (HTTP 403, with a specific message). */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
