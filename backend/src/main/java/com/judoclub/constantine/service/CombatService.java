package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.CombatDtos;
import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.exception.BadRequestException;
import com.judoclub.constantine.exception.ResourceNotFoundException;
import com.judoclub.constantine.repository.CombatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CombatService {
    private final CombatRepository combatRepository;
    private final EventService eventService;
    private final TatamiService tatamiService;
    private final AthleteService athleteService;
    private final MapperService mapper;

    public List<CombatDtos.CombatResponse> list(Long eventId) {
        eventService.getEntity(eventId);
        return combatRepository.findByEventIdOrderByCombatNumberAsc(eventId).stream().map(mapper::combat).toList();
    }

    public Combat getEntity(Long id) {
        return combatRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Combat introuvable"));
    }

    public CombatDtos.CombatResponse get(Long id) {
        return mapper.combat(getEntity(id));
    }

    @Transactional
    public CombatDtos.CombatResponse create(CombatDtos.CombatRequest request) {
        return mapper.combat(combatRepository.save(build(new Combat(), request)));
    }

    @Transactional
    public CombatDtos.CombatResponse update(Long id, CombatDtos.CombatRequest request) {
        return mapper.combat(build(getEntity(id), request));
    }

    @Transactional
    public void delete(Long id) {
        combatRepository.delete(getEntity(id));
    }

    @Transactional
    public CombatDtos.CombatResponse start(Long id) {
        Combat combat = getEntity(id);
        combat.setStatus(CombatStatus.IN_PROGRESS);
        combat.setActualStartTime(OffsetDateTime.now());
        return mapper.combat(combat);
    }

    @Transactional
    public CombatDtos.CombatResponse finish(Long id) {
        Combat combat = getEntity(id);
        combat.setStatus(CombatStatus.FINISHED);
        combat.setActualEndTime(OffsetDateTime.now());
        return mapper.combat(combat);
    }

    private Combat build(Combat combat, CombatDtos.CombatRequest request) {
        Event event = eventService.getEntity(request.eventId());
        Tatami tatami = tatamiService.getEntity(request.tatamiId());
        if (!tatami.getEvent().getId().equals(event.getId())) {
            throw new BadRequestException("Le tapis ne correspond pas à cet événement");
        }
        combat.setEvent(event);
        combat.setTatami(tatami);
        combat.setAthlete1(athleteService.getEntity(request.athlete1Id()));
        combat.setAthlete2(athleteService.getEntity(request.athlete2Id()));
        combat.setCombatNumber(request.combatNumber());
        combat.setWeightCategory(request.weightCategory());
        combat.setAgeCategory(request.ageCategory());
        combat.setStatus(request.status());
        combat.setScheduledStartTime(request.scheduledStartTime());
        return combat;
    }
}
