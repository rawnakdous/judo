package com.judoclub.constantine.util;

import com.judoclub.constantine.entity.Event;

import java.time.OffsetDateTime;

public final class EventStatusCalculator {
    private EventStatusCalculator() {}

    public static String status(Event event) {
        OffsetDateTime now = OffsetDateTime.now(event.getStartDatetime().getOffset());
        if (now.isBefore(event.getStartDatetime())) {
            return "UPCOMING";
        }
        if (now.isAfter(event.getEndDatetime())) {
            return "FINISHED";
        }
        return "LIVE";
    }
}
