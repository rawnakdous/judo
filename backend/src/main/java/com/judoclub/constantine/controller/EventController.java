package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.EventDtos;
import com.judoclub.constantine.service.EventService;
import jakarta.validation.Valid;
import com.judoclub.constantine.entity.EventStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping
    public List<EventDtos.EventResponse> list(
            @RequestParam(required = false) EventStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return eventService.list(status, from, to);
    }

    @GetMapping("/{id}")
    public EventDtos.EventResponse get(@PathVariable Long id) {
        return eventService.get(id);
    }

    @PostMapping
    public EventDtos.EventResponse create(@Valid @RequestBody EventDtos.EventRequest request) {
        return eventService.create(request);
    }

    @PutMapping("/{id}")
    public EventDtos.EventResponse update(@PathVariable Long id, @Valid @RequestBody EventDtos.EventRequest request) {
        return eventService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        eventService.delete(id);
    }
}
