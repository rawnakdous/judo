package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.LiveDtos;
import com.judoclub.constantine.dto.TatamiDtos;
import com.judoclub.constantine.entity.CombatStatus;
import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.entity.Tatami;
import com.judoclub.constantine.exception.ResourceNotFoundException;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.repository.TatamiRepository;
import com.judoclub.constantine.util.YouTubeUrlUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TatamiService {
    private final TatamiRepository tatamiRepository;
    private final CombatRepository combatRepository;
    private final EventService eventService;
    private final MapperService mapper;

    public List<TatamiDtos.TatamiResponse> list(Long eventId) {
        eventService.getEntity(eventId);
        return tatamiRepository.findByEventIdOrderByNumberAsc(eventId).stream().map(mapper::tatami).toList();
    }

    public Tatami getEntity(Long id) {
        return tatamiRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tapis introuvable"));
    }

    public Tatami getEntity(Long eventId, Long tatamiId) {
        return tatamiRepository.findByEventIdAndId(eventId, tatamiId).orElseThrow(() -> new ResourceNotFoundException("Tapis introuvable"));
    }

    public TatamiDtos.TatamiResponse get(Long eventId, Long tatamiId) {
        return mapper.tatami(getEntity(eventId, tatamiId));
    }

    @Transactional
    public TatamiDtos.TatamiResponse create(Long eventId, TatamiDtos.TatamiRequest request) {
        Event event = eventService.getEntity(eventId);
        Tatami tatami = Tatami.builder()
                .event(event)
                .number(request.number())
                .name(request.name())
                .liveUrl(YouTubeUrlUtil.normalize(request.liveUrl()))
                .active(request.active())
                .build();
        return mapper.tatami(tatamiRepository.save(tatami));
    }

    @Transactional
    public TatamiDtos.TatamiResponse update(Long id, TatamiDtos.TatamiRequest request) {
        Tatami tatami = getEntity(id);
        tatami.setNumber(request.number());
        tatami.setName(request.name());
        tatami.setLiveUrl(YouTubeUrlUtil.normalize(request.liveUrl()));
        tatami.setActive(request.active());
        return mapper.tatami(tatami);
    }

    @Transactional
    public TatamiDtos.TatamiResponse updateLive(Long eventId, Long tatamiId, TatamiDtos.LiveUpdateRequest request) {
        Tatami tatami = getEntity(eventId, tatamiId);
        tatami.setLiveUrl(YouTubeUrlUtil.normalize(request.liveUrl()));
        tatami.setActive(request.active());
        if (request.currentCombatId() != null) {
            combatRepository.findById(request.currentCombatId()).ifPresent(combat -> {
                combat.setTatami(tatami);
                combat.setStatus(CombatStatus.IN_PROGRESS);
            });
        }
        return mapper.tatami(tatami);
    }

    @Transactional
    public void delete(Long id) {
        tatamiRepository.delete(getEntity(id));
    }

    public LiveDtos.TatamiLiveResponse live(Long eventId, Long tatamiId) {
        Tatami tatami = getEntity(eventId, tatamiId);
        return toLive(tatami);
    }

    public LiveDtos.TatamiLiveResponse toLive(Tatami tatami) {
        var current = combatRepository.findFirstByTatami_IdAndStatusOrderByCombatNumberAsc(tatami.getId(), CombatStatus.IN_PROGRESS)
                .map(mapper::combat)
                .orElse(null);
        var upcoming = combatRepository.findTop5ByTatami_IdAndStatusOrderByScheduledStartTimeAscCombatNumberAsc(tatami.getId(), CombatStatus.UPCOMING)
                .stream().map(mapper::combat).toList();
        return new LiveDtos.TatamiLiveResponse(tatami.getId(), tatami.getNumber(), tatami.getName(), tatami.getLiveUrl(), tatami.isActive(), current, upcoming);
    }
}
