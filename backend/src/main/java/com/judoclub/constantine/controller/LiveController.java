package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.LiveDtos;
import com.judoclub.constantine.dto.TatamiDtos;
import com.judoclub.constantine.service.LiveService;
import com.judoclub.constantine.service.TatamiService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LiveController {
    private final LiveService liveService;
    private final TatamiService tatamiService;

    @GetMapping("/api/events/{eventId}/live")
    public LiveDtos.EventLiveResponse eventLive(@PathVariable Long eventId) {
        return liveService.eventLive(eventId);
    }

    @GetMapping("/api/events/{eventId}/tatamis/{tatamiId}/live")
    public LiveDtos.TatamiLiveResponse tatamiLive(@PathVariable Long eventId, @PathVariable Long tatamiId) {
        return tatamiService.live(eventId, tatamiId);
    }

    @PutMapping("/api/events/{eventId}/tatamis/{tatamiId}/live")
    public TatamiDtos.TatamiResponse updateLive(@PathVariable Long eventId, @PathVariable Long tatamiId, @RequestBody TatamiDtos.LiveUpdateRequest request) {
        return tatamiService.updateLive(eventId, tatamiId, request);
    }
}
