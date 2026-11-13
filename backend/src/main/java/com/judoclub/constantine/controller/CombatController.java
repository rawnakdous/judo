package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.CombatDtos;
import com.judoclub.constantine.dto.ImportDtos;
import com.judoclub.constantine.service.CombatImportService;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import com.judoclub.constantine.service.CombatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CombatController {
    private final CombatService combatService;
    private final CombatImportService combatImportService;

    @GetMapping("/api/events/{eventId}/combats")
    public List<CombatDtos.CombatResponse> list(@PathVariable Long eventId) {
        return combatService.list(eventId);
    }

    /** Multipart field "file": CSV schedule of the event's fights (all rows valid or nothing imported). */
    @PostMapping(value = "/api/events/{eventId}/combats/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportDtos.CombatImportResult importCsv(@PathVariable Long eventId, @RequestParam("file") MultipartFile file) {
        return combatImportService.importCsv(eventId, file);
    }

    @PostMapping("/api/combats")
    public CombatDtos.CombatResponse create(@Valid @RequestBody CombatDtos.CombatRequest request) {
        return combatService.create(request);
    }

    @GetMapping("/api/combats/{id}")
    public CombatDtos.CombatResponse get(@PathVariable Long id) {
        return combatService.get(id);
    }

    @PutMapping("/api/combats/{id}")
    public CombatDtos.CombatResponse update(@PathVariable Long id, @Valid @RequestBody CombatDtos.CombatRequest request) {
        return combatService.update(id, request);
    }

    @DeleteMapping("/api/combats/{id}")
    public void delete(@PathVariable Long id) {
        combatService.delete(id);
    }

    @PostMapping("/api/combats/{id}/start")
    public CombatDtos.CombatResponse start(@PathVariable Long id) {
        return combatService.start(id);
    }

    @PostMapping("/api/combats/{id}/reset")
    public CombatDtos.CombatResponse reset(@PathVariable Long id) {
        return combatService.reset(id);
    }

    @PostMapping("/api/combats/{id}/finish")
    public CombatDtos.CombatResponse finish(@PathVariable Long id) {
        return combatService.finish(id);
    }
}
