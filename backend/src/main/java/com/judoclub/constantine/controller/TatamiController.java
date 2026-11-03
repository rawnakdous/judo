package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.TatamiDtos;
import com.judoclub.constantine.service.TatamiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class TatamiController {
    private final TatamiService tatamiService;

    @GetMapping("/api/events/{eventId}/tatamis")
    public List<TatamiDtos.TatamiResponse> list(@PathVariable Long eventId) {
        return tatamiService.list(eventId);
    }

    @GetMapping("/api/events/{eventId}/tatamis/{tatamiId}")
    public TatamiDtos.TatamiResponse get(@PathVariable Long eventId, @PathVariable Long tatamiId) {
        return tatamiService.get(eventId, tatamiId);
    }

    @PostMapping("/api/events/{eventId}/tatamis")
    public TatamiDtos.TatamiResponse create(@PathVariable Long eventId, @Valid @RequestBody TatamiDtos.TatamiRequest request) {
        return tatamiService.create(eventId, request);
    }

    @PutMapping("/api/tatamis/{id}")
    public TatamiDtos.TatamiResponse update(@PathVariable Long id, @Valid @RequestBody TatamiDtos.TatamiRequest request) {
        return tatamiService.update(id, request);
    }

    @DeleteMapping("/api/tatamis/{id}")
    public void delete(@PathVariable Long id) {
        tatamiService.delete(id);
    }
}
