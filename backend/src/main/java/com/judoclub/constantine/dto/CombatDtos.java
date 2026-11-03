package com.judoclub.constantine.dto;

import com.judoclub.constantine.entity.CombatStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public final class CombatDtos {
    private CombatDtos() {}

    public record CombatRequest(
            @NotNull Long eventId,
            @NotNull Long tatamiId,
            @NotNull Long athlete1Id,
            @NotNull Long athlete2Id,
            @NotNull Integer combatNumber,
            @NotBlank String weightCategory,
            @NotBlank String ageCategory,
            @NotNull CombatStatus status,
            OffsetDateTime scheduledStartTime
    ) {}

    public record CombatResponse(
            Long id,
            Long eventId,
            Long tatamiId,
            Integer tatamiNumber,
            Integer combatNumber,
            AthleteDtos.AthleteResponse athlete1,
            AthleteDtos.AthleteResponse athlete2,
            String weightCategory,
            String ageCategory,
            CombatStatus status,
            OffsetDateTime scheduledStartTime,
            OffsetDateTime actualStartTime,
            OffsetDateTime actualEndTime
    ) {}
}
