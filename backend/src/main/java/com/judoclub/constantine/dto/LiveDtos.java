package com.judoclub.constantine.dto;

import java.util.List;

public final class LiveDtos {
    private LiveDtos() {}

    public record EventLiveResponse(
            EventDtos.EventResponse event,
            List<TatamiLiveResponse> tatamis
    ) {}

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
