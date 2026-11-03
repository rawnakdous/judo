package com.judoclub.constantine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class TatamiDtos {
    private TatamiDtos() {}

    public record TatamiRequest(@NotNull Integer number, @NotBlank String name, String liveUrl, boolean active) {}

    public record TatamiResponse(Long id, Long eventId, Integer number, String name, String liveUrl, boolean active) {}

    public record LiveUpdateRequest(String liveUrl, boolean active, Long currentCombatId) {}
}
