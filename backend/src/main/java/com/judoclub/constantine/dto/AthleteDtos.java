package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class AthleteDtos {
    private AthleteDtos() {}

    public record AthleteRequest(
            @NotBlank(message = "Le prénom est obligatoire")
            @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères") String firstName,
            @NotBlank(message = "Le nom est obligatoire")
            @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères") String lastName,
            @NotBlank(message = "Le club est obligatoire")
            @Size(max = 160, message = "Le club ne doit pas dépasser 160 caractères") String club,
            @Size(max = 120, message = "Le pays ne doit pas dépasser 120 caractères") String country,
            @Size(max = 500, message = "Le lien de la photo ne doit pas dépasser 500 caractères")
            @Pattern(regexp = ValidationPatterns.HTTP_URL_OR_EMPTY, message = "Le lien de la photo doit commencer par http:// ou https://") String profileImageUrl
    ) {}

    public record AthleteResponse(Long id, String firstName, String lastName, String club, String country, String profileImageUrl) {}
}
