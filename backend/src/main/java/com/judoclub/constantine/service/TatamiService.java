package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.LiveDtos;
import com.judoclub.constantine.dto.TatamiDtos;
import com.judoclub.constantine.entity.Combat;
import com.judoclub.constantine.entity.CombatStatus;
import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.entity.Tatami;
import com.judoclub.constantine.exception.ResourceNotFoundException;
import com.judoclub.constantine.exception.StaleTatamiStateException;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.repository.TatamiRepository;
import com.judoclub.constantine.util.YouTubeUrlUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TatamiService {
    private final TatamiRepository tatamiRepository;
    private final CombatRepository combatRepository;
    private final EventService eventService;
    private final MapperService mapper;

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
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
        return mapper.tatami(tatami);
    }

    @Transactional
    public void delete(Long id) {
        tatamiRepository.delete(getEntity(id));
    }

    @Transactional(readOnly = true)
    public LiveDtos.TatamiLiveResponse live(Long eventId, Long tatamiId) {
        Tatami tatami = getEntity(eventId, tatamiId);
        return toLive(tatami);
    }

    /**
     * One-tap "Combat suivant": finishes the current fight (if any) and starts the next upcoming one.
     * Idempotent under retries: if {@code expectedCurrentCombatId} is not the current fight, nothing
     * changes and the current state is returned with a 409.
     */
    @Transactional
    public LiveDtos.TatamiLiveResponse next(Long eventId, Long tatamiId, Long expectedCurrentCombatId) {
        Tatami tatami = tatamiRepository.findForUpdate(eventId, tatamiId)
                .orElseThrow(() -> new ResourceNotFoundException("Tapis introuvable"));
        Optional<Combat> current = combatRepository.findFirstByTatami_IdAndStatusOrderByCombatNumberAsc(tatami.getId(), CombatStatus.IN_PROGRESS);

        Long currentId = current.map(Combat::getId).orElse(null);
        if (!Objects.equals(currentId, expectedCurrentCombatId)) {
            throw new StaleTatamiStateException(toLive(tatami));
        }

        OffsetDateTime now = OffsetDateTime.now();
        current.ifPresent(combat -> {
            combat.finish(now);
            combatRepository.flush(); // free the "one IN_PROGRESS per tatami" slot before starting the next one
        });
        combatRepository.findFirstByTatami_IdAndStatusOrderByScheduledStartTimeAscCombatNumberAsc(tatami.getId(), CombatStatus.UPCOMING)
                .ifPresent(next -> next.start(now));
        combatRepository.flush();
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
