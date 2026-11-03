package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.AthleteDtos;
import com.judoclub.constantine.service.AthleteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/athletes")
@RequiredArgsConstructor
public class AthleteController {
    private final AthleteService athleteService;

    @GetMapping
    public List<AthleteDtos.AthleteResponse> list(@RequestParam(required = false) String q) {
        return athleteService.list(q);
    }

    @PostMapping
    public AthleteDtos.AthleteResponse create(@Valid @RequestBody AthleteDtos.AthleteRequest request) {
        return athleteService.create(request);
    }

    @PutMapping("/{id}")
    public AthleteDtos.AthleteResponse update(@PathVariable Long id, @Valid @RequestBody AthleteDtos.AthleteRequest request) {
        return athleteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        athleteService.delete(id);
    }
}
