package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;

public final class AthleteDtos {
    private AthleteDtos() {}

    public record AthleteRequest(@NotBlank String firstName, @NotBlank String lastName, @NotBlank String club, String country, String profileImageUrl) {}

    public record AthleteResponse(Long id, String firstName, String lastName, String club, String country, String profileImageUrl) {}
}
