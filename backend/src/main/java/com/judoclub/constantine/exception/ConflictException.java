package com.judoclub.constantine.exception;

/** A business rule conflict with the current state of the data (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
