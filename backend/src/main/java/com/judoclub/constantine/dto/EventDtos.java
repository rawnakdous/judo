package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class EventDtos {
    private EventDtos() {}

    public record EventRequest(
            @NotBlank @Size(max = 180) String title,
            @NotBlank String description,
            String imageUrl,
            @NotBlank String location,
            @NotNull OffsetDateTime startDatetime,
            @NotNull OffsetDateTime endDatetime,
            @NotBlank String organizerName
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
