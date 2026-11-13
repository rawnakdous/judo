package com.judoclub.constantine.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;

/**
 * Error body returned by every failing API call. The frontend reads {@code message};
 * {@code errors} lists per-field validation problems and is omitted when empty.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public record ApiError(int status, String message, Instant timestamp, List<FieldError> errors) {

    public ApiError(int status, String message) {
        this(status, message, Instant.now(), List.of());
    }

    public record FieldError(String field, String message) {}
}
