package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.LiveDtos;
import com.judoclub.constantine.dto.TatamiDtos;
import com.judoclub.constantine.service.LiveService;
import com.judoclub.constantine.service.TatamiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class LiveController {
    private final LiveService liveService;
    private final TatamiService tatamiService;

    /** Polled by every live viewer every ~10 s; a short public cache absorbs bursts. */
    private static final CacheControl LIVE_CACHE = CacheControl.maxAge(Duration.ofSeconds(5)).cachePublic();

    @GetMapping("/api/events/{eventId}/live")
    public ResponseEntity<LiveDtos.EventLiveResponse> eventLive(@PathVariable Long eventId) {
        return ResponseEntity.ok().cacheControl(LIVE_CACHE).body(liveService.eventLive(eventId));
    }

    @GetMapping("/api/events/{eventId}/tatamis/{tatamiId}/live")
    public ResponseEntity<LiveDtos.TatamiLiveResponse> tatamiLive(@PathVariable Long eventId, @PathVariable Long tatamiId) {
        return ResponseEntity.ok().cacheControl(LIVE_CACHE).body(tatamiService.live(eventId, tatamiId));
    }

    @PostMapping("/api/events/{eventId}/tatamis/{tatamiId}/next")
    public LiveDtos.TatamiLiveResponse next(@PathVariable Long eventId, @PathVariable Long tatamiId, @RequestBody LiveDtos.NextCombatRequest request) {
        return tatamiService.next(eventId, tatamiId, request.expectedCurrentCombatId());
    }

    @PutMapping("/api/events/{eventId}/tatamis/{tatamiId}/live")
    public TatamiDtos.TatamiResponse updateLive(@PathVariable Long eventId, @PathVariable Long tatamiId, @Valid @RequestBody TatamiDtos.LiveUpdateRequest request) {
        return tatamiService.updateLive(eventId, tatamiId, request);
    }
}
