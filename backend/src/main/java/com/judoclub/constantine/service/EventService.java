package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.EventDtos;
import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.entity.Tatami;
import com.judoclub.constantine.exception.BadRequestException;
import com.judoclub.constantine.exception.ResourceNotFoundException;
import com.judoclub.constantine.entity.EventStatus;
import com.judoclub.constantine.repository.EventRepository;
import com.judoclub.constantine.repository.EventSpecifications;
import com.judoclub.constantine.util.Strings;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {
    private final EventRepository eventRepository;
    private final MapperService mapper;

    /** Dates in from/to are whole days in the club's time zone. */
    public static final ZoneId CLUB_ZONE = ZoneId.of("Africa/Algiers");

    /** Events sorted by start date; optional status filter and [from, to] day range (inclusive, overlap). */
    @Transactional(readOnly = true)
    public List<EventDtos.EventResponse> list(EventStatus status, LocalDate from, LocalDate to) {
        if (from != null && to != null && to.isBefore(from)) {
            throw new BadRequestException("La date « to » doit être postérieure ou égale à « from »");
        }
        OffsetDateTime fromStart = from == null ? null : from.atStartOfDay(CLUB_ZONE).toOffsetDateTime();
        OffsetDateTime toExclusive = to == null ? null : to.plusDays(1).atStartOfDay(CLUB_ZONE).toOffsetDateTime();
        Specification<Event> spec = Specification.where(EventSpecifications.hasStatus(status, OffsetDateTime.now()))
                .and(EventSpecifications.overlaps(fromStart, toExclusive));
        return eventRepository.findAll(spec, Sort.by("startDatetime").ascending().and(Sort.by("id")))
                .stream().map(mapper::event).toList();
    }

    public Event getEntity(Long id) {
        return eventRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Événement introuvable"));
    }

    @Transactional(readOnly = true)
    public EventDtos.EventResponse get(Long id) {
        return mapper.event(getEntity(id));
    }

    @Transactional
    public EventDtos.EventResponse create(EventDtos.EventRequest request) {
        validateDates(request);
        Event event = Event.builder()
                .title(request.title())
                .description(request.description())
                .imageUrl(Strings.blankToNull(request.imageUrl()))
                .location(request.location())
                .startDatetime(request.startDatetime())
                .endDatetime(request.endDatetime())
                .organizerName(request.organizerName())
                .build();
        for (int i = 1; i <= 3; i++) {
            event.getTatamis().add(Tatami.builder().event(event).number(i).name("Tapis " + i).active(false).build());
        }
        return mapper.event(eventRepository.save(event));
    }

    @Transactional
    public EventDtos.EventResponse update(Long id, EventDtos.EventRequest request) {
        validateDates(request);
        Event event = getEntity(id);
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setImageUrl(Strings.blankToNull(request.imageUrl()));
        event.setLocation(request.location());
        event.setStartDatetime(request.startDatetime());
        event.setEndDatetime(request.endDatetime());
        event.setOrganizerName(request.organizerName());
        return mapper.event(event);
    }

    @Transactional
    public void delete(Long id) {
        eventRepository.delete(getEntity(id));
    }

    private void validateDates(EventDtos.EventRequest request) {
        if (!request.endDatetime().isAfter(request.startDatetime())) {
            throw new BadRequestException("La date de fin doit être postérieure à la date de début");
        }
    }
}
