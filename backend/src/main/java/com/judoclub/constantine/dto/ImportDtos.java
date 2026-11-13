package com.judoclub.constantine.dto;

import java.time.Instant;
import java.util.List;

public final class ImportDtos {
    private ImportDtos() {}

    public record CombatImportResult(int created, int athletesCreated) {}

    /** {@code row} is the line number in the file (header = 1, first fight = 2), like in a spreadsheet. */
    public record RowError(int row, String message) {}

    /** 400 body when the file is rejected: nothing was imported. */
    public record ImportError(int status, String message, Instant timestamp, List<RowError> errors) {}
}
