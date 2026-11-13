package com.judoclub.constantine.exception;

import com.judoclub.constantine.dto.ImportDtos;
import lombok.Getter;

import java.util.List;

/** The import file has invalid rows; nothing was imported (HTTP 400 with per-row errors). */
@Getter
public class ImportValidationException extends RuntimeException {
    private final transient List<ImportDtos.RowError> errors;

    public ImportValidationException(String message, List<ImportDtos.RowError> errors) {
        super(message);
        this.errors = List.copyOf(errors);
    }
}
