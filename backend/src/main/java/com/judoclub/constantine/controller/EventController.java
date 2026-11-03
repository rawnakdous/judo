package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.EventDtos;
import com.judoclub.constantine.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping
    public List<EventDtos.EventResponse> list() {
        return eventService.list();
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
