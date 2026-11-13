package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.entity.EventStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.OffsetDateTime;

/**
 * Filters for GET /api/events. Status rules must match {@code EventStatusCalculator}:
 * UPCOMING = now before start, FINISHED = now after end, LIVE = otherwise.
 */
public final class EventSpecifications {
    private EventSpecifications() {}

    public static Specification<Event> hasStatus(EventStatus status, OffsetDateTime now) {
        if (status == null) return null;
        return switch (status) {
            case UPCOMING -> (root, q, cb) -> cb.greaterThan(root.get("startDatetime"), now);
            case FINISHED -> (root, q, cb) -> cb.lessThan(root.get("endDatetime"), now);
            case LIVE -> (root, q, cb) -> cb.and(
                    cb.lessThanOrEqualTo(root.get("startDatetime"), now),
                    cb.greaterThanOrEqualTo(root.get("endDatetime"), now));
        };
    }

    /** Events overlapping [from, toExclusive). Either bound may be null. */
    public static Specification<Event> overlaps(OffsetDateTime from, OffsetDateTime toExclusive) {
        Specification<Event> spec = Specification.where(null);
        if (from != null) {
            spec = spec.and((root, q, cb) -> cb.greaterThan(root.get("endDatetime"), from));
        }
        if (toExclusive != null) {
            spec = spec.and((root, q, cb) -> cb.lessThan(root.get("startDatetime"), toExclusive));
        }
        return spec;
    }
}
