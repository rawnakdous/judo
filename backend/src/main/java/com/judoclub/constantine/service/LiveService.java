package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.LiveDtos;
import com.judoclub.constantine.repository.TatamiRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LiveService {
    private final EventService eventService;
    private final TatamiRepository tatamiRepository;
    private final TatamiService tatamiService;

    public LiveDtos.EventLiveResponse eventLive(Long eventId) {
        var event = eventService.getEntity(eventId);
        var tatamis = tatamiRepository.findByEventIdOrderByNumberAsc(eventId).stream()
                .map(tatamiService::toLive)
                .toList();
        return new LiveDtos.EventLiveResponse(eventService.get(event.getId()), tatamis);
    }
}
