package com.judoclub.constantine.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank(message = "Le prénom est obligatoire")
            @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères") String firstName,
            @NotBlank(message = "Le nom est obligatoire")
            @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères") String lastName,
            @NotBlank(message = "L'adresse e-mail est obligatoire")
            @Email(message = "L'adresse e-mail est invalide")
            @Size(max = 190, message = "L'adresse e-mail ne doit pas dépasser 190 caractères") String email,
            @NotNull(message = "Le mot de passe est obligatoire")
            @Size(min = 8, max = 120, message = "Le mot de passe doit contenir entre 8 et 120 caractères") String password
    ) {}

    public record LoginRequest(
            @NotBlank(message = "L'adresse e-mail est obligatoire")
            @Email(message = "L'adresse e-mail est invalide") String email,
            @NotBlank(message = "Le mot de passe est obligatoire") String password
    ) {}

    public record AuthResponse(UserDto user) {}
}
