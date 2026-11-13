package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.AthleteDtos;
import com.judoclub.constantine.entity.Athlete;
import com.judoclub.constantine.exception.ResourceNotFoundException;
import com.judoclub.constantine.repository.AthleteRepository;
import com.judoclub.constantine.util.Strings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AthleteService {
    private final AthleteRepository athleteRepository;
    private final MapperService mapper;

    @Transactional(readOnly = true)
    public List<AthleteDtos.AthleteResponse> list(String query) {
        List<Athlete> athletes = query == null || query.isBlank()
                ? athleteRepository.findAll()
                : athleteRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrClubContainingIgnoreCase(query, query, query);
        return athletes.stream().map(mapper::athlete).toList();
    }

    public Athlete getEntity(Long id) {
        return athleteRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Athlète introuvable"));
    }

    @Transactional
    public AthleteDtos.AthleteResponse create(AthleteDtos.AthleteRequest request) {
        return mapper.athlete(athleteRepository.save(Athlete.builder()
                .firstName(request.firstName()).lastName(request.lastName()).club(request.club())
                .country(Strings.blankToNull(request.country())).profileImageUrl(Strings.blankToNull(request.profileImageUrl())).build()));
    }

    @Transactional
    public AthleteDtos.AthleteResponse update(Long id, AthleteDtos.AthleteRequest request) {
        Athlete athlete = getEntity(id);
        athlete.setFirstName(request.firstName());
        athlete.setLastName(request.lastName());
        athlete.setClub(request.club());
        athlete.setCountry(Strings.blankToNull(request.country()));
        athlete.setProfileImageUrl(Strings.blankToNull(request.profileImageUrl()));
        return mapper.athlete(athlete);
    }

    @Transactional
    public void delete(Long id) {
        athleteRepository.delete(getEntity(id));
    }
}
