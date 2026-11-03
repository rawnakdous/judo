package com.judoclub.constantine;

import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.util.EventStatusCalculator;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;

class EventStatusCalculatorTest {
    @Test
    void calculatesLiveStatusFromDates() {
        Event event = Event.builder()
                .startDatetime(OffsetDateTime.now().minusHours(1))
                .endDatetime(OffsetDateTime.now().plusHours(1))
                .build();
        assertThat(EventStatusCalculator.status(event)).isEqualTo("LIVE");
    }
}
