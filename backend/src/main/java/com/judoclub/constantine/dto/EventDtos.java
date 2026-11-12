package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class EventDtos {
    private EventDtos() {}

    public record EventRequest(
            @NotBlank(message = "Le titre est obligatoire")
            @Size(max = 180, message = "Le titre ne doit pas dépasser 180 caractères") String title,
            @NotBlank(message = "La description est obligatoire")
            @Size(max = 10000, message = "La description ne doit pas dépasser 10 000 caractères") String description,
            @Size(max = 500, message = "Le lien de l'image ne doit pas dépasser 500 caractères")
            @Pattern(regexp = ValidationPatterns.HTTP_URL_OR_EMPTY, message = "Le lien de l'image doit commencer par http:// ou https://") String imageUrl,
            @NotBlank(message = "Le lieu est obligatoire")
            @Size(max = 220, message = "Le lieu ne doit pas dépasser 220 caractères") String location,
            @NotNull(message = "La date de début est obligatoire") OffsetDateTime startDatetime,
            @NotNull(message = "La date de fin est obligatoire") OffsetDateTime endDatetime,
            @NotBlank(message = "L'organisateur est obligatoire")
            @Size(max = 160, message = "L'organisateur ne doit pas dépasser 160 caractères") String organizerName
    ) {}

    public record EventResponse(
            Long id,
            String title,
            String description,
            String imageUrl,
            String location,
            OffsetDateTime startDatetime,
            OffsetDateTime endDatetime,
            String organizerName,
            String status
    ) {}
}
