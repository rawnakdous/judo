package com.judoclub.constantine;

import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** GET /api/events: sorted by start date, optional ?status= and ?from=&to= (calendar) filters. */
class EventListFilterIntegrationTest extends AbstractIntegrationTest {

    private static final ZoneOffset ALGIERS = ZoneOffset.ofHours(1);

    private static OffsetDateTime at(int y, int m, int d, int h) {
        return OffsetDateTime.of(y, m, d, h, 0, 0, 0, ALGIERS);
    }

    private void statusFixtures() {
        OffsetDateTime now = OffsetDateTime.now();
        data.event("Futur lointain", now.plusDays(30), now.plusDays(31), 1);
        data.event("Passé", now.minusDays(10), now.minusDays(9), 1);
        data.event("En cours", now.minusHours(2), now.plusHours(2), 1);
        data.event("Futur proche", now.plusDays(2), now.plusDays(3), 1);
    }

    @Test
    void listIsSortedByStartDate() throws Exception {
        statusFixtures();
        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title").value(contains("Passé", "En cours", "Futur proche", "Futur lointain")));
    }

    @Test
    void filtersByStatus() throws Exception {
        statusFixtures();
        mockMvc.perform(get("/api/events").param("status", "UPCOMING"))
                .andExpect(jsonPath("$[*].title").value(contains("Futur proche", "Futur lointain")))
                .andExpect(jsonPath("$[*].status").value(contains("UPCOMING", "UPCOMING")));
        mockMvc.perform(get("/api/events").param("status", "LIVE"))
                .andExpect(jsonPath("$[*].title").value(contains("En cours")));
        mockMvc.perform(get("/api/events").param("status", "FINISHED"))
                .andExpect(jsonPath("$[*].title").value(contains("Passé")));
    }

    @Test
    void dateRangeReturnsOverlappingEvents() throws Exception {
        data.event("Avant (fin 30 nov)", at(2026, 11, 28, 9), at(2026, 11, 30, 18), 1);
        data.event("Chevauche le début", at(2026, 11, 29, 9), at(2026, 12, 2, 18), 1);
        data.event("Dedans", at(2026, 12, 10, 9), at(2026, 12, 10, 18), 1);
        data.event("Chevauche la fin", at(2026, 12, 31, 9), at(2027, 1, 2, 18), 1);
        data.event("Après", at(2027, 1, 5, 9), at(2027, 1, 6, 18), 1);
        data.event("Englobe tout", at(2026, 11, 1, 9), at(2027, 2, 1, 18), 1);

        mockMvc.perform(get("/api/events").param("from", "2026-12-01").param("to", "2026-12-31"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].title").value(contains(
                        "Englobe tout", "Chevauche le début", "Dedans", "Chevauche la fin")));
    }

    @Test
    void dayBoundariesUseAlgiersTime() throws Exception {
        // 23:30 in Algiers on 1 Dec is 22:30 UTC on 1 Dec: belongs to 1 Dec, not 2 Dec.
        data.event("Soirée du 1er", at(2026, 12, 1, 23).plusMinutes(30), at(2026, 12, 1, 23).plusMinutes(50), 1);
        // 00:30 in Algiers on 2 Dec is 23:30 UTC on 1 Dec: belongs to 2 Dec.
        data.event("Nuit du 2", at(2026, 12, 2, 0).plusMinutes(30), at(2026, 12, 2, 1), 1);

        mockMvc.perform(get("/api/events").param("from", "2026-12-02").param("to", "2026-12-02"))
                .andExpect(jsonPath("$[*].title").value(contains("Nuit du 2")));
        mockMvc.perform(get("/api/events").param("from", "2026-12-01").param("to", "2026-12-01"))
                .andExpect(jsonPath("$[*].title").value(contains("Soirée du 1er")));
    }

    @Test
    void openEndedRanges() throws Exception {
        data.event("Décembre", at(2026, 12, 10, 9), at(2026, 12, 10, 18), 1);
        data.event("Janvier", at(2027, 1, 10, 9), at(2027, 1, 10, 18), 1);

        mockMvc.perform(get("/api/events").param("from", "2027-01-01"))
                .andExpect(jsonPath("$[*].title").value(contains("Janvier")));
        mockMvc.perform(get("/api/events").param("to", "2026-12-31"))
                .andExpect(jsonPath("$[*].title").value(contains("Décembre")));
    }

    @Test
    void statusAndRangeCombine() throws Exception {
        OffsetDateTime now = OffsetDateTime.now();
        data.event("Passé récent", now.minusDays(3), now.minusDays(2), 1);
        data.event("Futur", now.plusDays(2), now.plusDays(3), 1);
        String from = now.minusDays(5).toLocalDate().toString();
        String to = now.plusDays(5).toLocalDate().toString();

        mockMvc.perform(get("/api/events").param("status", "FINISHED").param("from", from).param("to", to))
                .andExpect(jsonPath("$[*].title").value(contains("Passé récent")));
    }

    @Test
    void invalidParametersReturn400() throws Exception {
        mockMvc.perform(get("/api/events").param("status", "SOON"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valeur invalide pour le paramètre « status »"));
        mockMvc.perform(get("/api/events").param("from", "01/12/2026"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valeur invalide pour le paramètre « from »"));
        mockMvc.perform(get("/api/events").param("from", "2026-12-31").param("to", "2026-12-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La date « to » doit être postérieure ou égale à « from »"));
    }
}
