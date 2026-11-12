package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.CombatDtos;
import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.exception.BadRequestException;
import com.judoclub.constantine.exception.ConflictException;
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

    @Transactional(readOnly = true)
    public List<CombatDtos.CombatResponse> list(Long eventId) {
        eventService.getEntity(eventId);
        return combatRepository.findByEventIdOrderByCombatNumberAsc(eventId).stream().map(mapper::combat).toList();
    }

    public Combat getEntity(Long id) {
        return combatRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Combat introuvable"));
    }

    @Transactional(readOnly = true)
    public CombatDtos.CombatResponse get(Long id) {
        return mapper.combat(combatRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Combat introuvable")));
    }

    @Transactional
    public CombatDtos.CombatResponse create(CombatDtos.CombatRequest request) {
        Combat combat = build(new Combat(), request);
        combat.setStatus(CombatStatus.UPCOMING);
        return mapper.combat(combatRepository.save(combat));
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
        if (combat.getStatus() == CombatStatus.UPCOMING
                && combatRepository.existsByTatami_IdAndStatusAndIdNot(combat.getTatami().getId(), CombatStatus.IN_PROGRESS, combat.getId())) {
            throw new ConflictException("Un combat est déjà en cours sur ce tapis");
        }
        combat.start(OffsetDateTime.now());
        return mapper.combat(combat);
    }

    @Transactional
    public CombatDtos.CombatResponse finish(Long id) {
        Combat combat = getEntity(id);
        combat.finish(OffsetDateTime.now());
        return mapper.combat(combat);
    }

    @Transactional
    public CombatDtos.CombatResponse reset(Long id) {
        Combat combat = getEntity(id);
        combat.reset();
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
        if (request.athlete1Id().equals(request.athlete2Id())) {
            throw new BadRequestException("Un athlète ne peut pas combattre contre lui-même");
        }
        combat.setAthlete1(athleteService.getEntity(request.athlete1Id()));
        combat.setAthlete2(athleteService.getEntity(request.athlete2Id()));
        combat.setCombatNumber(request.combatNumber());
        combat.setWeightCategory(request.weightCategory());
        combat.setAgeCategory(request.ageCategory());
        combat.setScheduledStartTime(request.scheduledStartTime());
        return combat;
    }
}
