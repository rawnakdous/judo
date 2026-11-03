package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.*;
import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.util.EventStatusCalculator;
import org.springframework.stereotype.Component;

@Component
public class MapperService {
    public UserDto user(User user) {
        return new UserDto(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getRole(), user.getProfileImageUrl(), user.getCreatedAt());
    }

    public EventDtos.EventResponse event(Event event) {
        return new EventDtos.EventResponse(event.getId(), event.getTitle(), event.getDescription(), event.getImageUrl(), event.getLocation(), event.getStartDatetime(), event.getEndDatetime(), event.getOrganizerName(), EventStatusCalculator.status(event));
    }

    public TatamiDtos.TatamiResponse tatami(Tatami tatami) {
        return new TatamiDtos.TatamiResponse(tatami.getId(), tatami.getEvent().getId(), tatami.getNumber(), tatami.getName(), tatami.getLiveUrl(), tatami.isActive());
    }

    public AthleteDtos.AthleteResponse athlete(Athlete athlete) {
        return new AthleteDtos.AthleteResponse(athlete.getId(), athlete.getFirstName(), athlete.getLastName(), athlete.getClub(), athlete.getCountry(), athlete.getProfileImageUrl());
    }

    public CombatDtos.CombatResponse combat(Combat combat) {
        return new CombatDtos.CombatResponse(
                combat.getId(),
                combat.getEvent().getId(),
                combat.getTatami().getId(),
                combat.getTatami().getNumber(),
                combat.getCombatNumber(),
                athlete(combat.getAthlete1()),
                athlete(combat.getAthlete2()),
                combat.getWeightCategory(),
                combat.getAgeCategory(),
                combat.getStatus(),
                combat.getScheduledStartTime(),
                combat.getActualStartTime(),
                combat.getActualEndTime()
        );
    }
}
