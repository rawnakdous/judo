package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public final class TatamiDtos {
    private TatamiDtos() {}

    public record TatamiRequest(
            @NotNull(message = "Le numéro du tapis est obligatoire")
            @Positive(message = "Le numéro du tapis doit être positif") Integer number,
            @NotBlank(message = "Le nom du tapis est obligatoire")
            @Size(max = 80, message = "Le nom du tapis ne doit pas dépasser 80 caractères") String name,
            @Size(max = 500, message = "Le lien YouTube ne doit pas dépasser 500 caractères") String liveUrl,
            boolean active
    ) {}

    public record TatamiResponse(Long id, Long eventId, Integer number, String name, String liveUrl, boolean active) {}

    /** Stream settings of a tatami. Current fights are driven only by start/finish/reset/next. */
    public record LiveUpdateRequest(
            @Size(max = 500, message = "Le lien YouTube ne doit pas dépasser 500 caractères") String liveUrl,
            boolean active
    ) {}
}
