package com.judoclub.constantine.dto;

import java.util.List;

public final class LiveDtos {
    private LiveDtos() {}

    /** {@code generatedAt}: server time when the snapshot was built, so clients can show staleness. */
    public record EventLiveResponse(
            EventDtos.EventResponse event,
            List<TatamiLiveResponse> tatamis,
            java.time.OffsetDateTime generatedAt
    ) {}

    /** Body of POST .../tatamis/{id}/next: the current combat id the operator saw (null if none). */
    public record NextCombatRequest(Long expectedCurrentCombatId) {}

    /** 409 body for a stale "next": the usual error fields plus the tatami's current state. */
    public record StaleTatamiError(int status, String message, java.time.Instant timestamp, TatamiLiveResponse tatami) {}

    public record TatamiLiveResponse(
            Long tatamiId,
            Integer number,
            String name,
            String liveUrl,
            boolean active,
            CombatDtos.CombatResponse currentCombat,
            List<CombatDtos.CombatResponse> upcomingCombats
    ) {}
}
