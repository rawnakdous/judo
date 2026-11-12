package com.judoclub.constantine.dto;

import com.judoclub.constantine.entity.CombatStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public final class CombatDtos {
    private CombatDtos() {}

    public record CombatRequest(
            @NotNull(message = "L'événement est obligatoire") Long eventId,
            @NotNull(message = "Le tapis est obligatoire") Long tatamiId,
            @NotNull(message = "L'athlète 1 est obligatoire") Long athlete1Id,
            @NotNull(message = "L'athlète 2 est obligatoire") Long athlete2Id,
            @NotNull(message = "Le numéro du combat est obligatoire")
            @Positive(message = "Le numéro du combat doit être positif") Integer combatNumber,
            @NotBlank(message = "La catégorie de poids est obligatoire")
            @Size(max = 40, message = "La catégorie de poids ne doit pas dépasser 40 caractères") String weightCategory,
            @NotBlank(message = "La catégorie d'âge est obligatoire")
            @Size(max = 80, message = "La catégorie d'âge ne doit pas dépasser 80 caractères") String ageCategory,
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
