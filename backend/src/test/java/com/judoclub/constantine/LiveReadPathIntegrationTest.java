package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Public read endpoints used by the live page and the admin live page. These map lazy
 * associations (tatami, athletes) and must not fail with LazyInitializationException.
 */
class LiveReadPathIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Event event;
    private Tatami tatami1;
    private Tatami tatami2;
    private Combat current;
    private Combat next;

    @BeforeEach
    void setUp() {
        event = data.liveEvent();
        List<Tatami> tatamis = data.tatamisOf(event);
        tatami1 = tatamis.get(0);
        tatami2 = tatamis.get(1);

        Athlete benali = data.athlete("Yacine", "Benali", "JS Bordj Bou Arréridj");
        Athlete khelifi = data.athlete("Rayan", "Khelifi", "CR Belouizdad");
        Athlete amir = data.athlete("Amir", "Kaci", "JCC");

        current = data.combat(event, tatami1, benali, khelifi, 1, CombatStatus.IN_PROGRESS);
        next = data.combat(event, tatami1, amir, benali, 2, CombatStatus.UPCOMING);
        data.combat(event, tatami2, khelifi, amir, 3, CombatStatus.UPCOMING);
    }

    @Test
    void eventLiveReturnsCurrentAndUpcomingCombatsPerTatami() throws Exception {
        mockMvc.perform(get("/api/events/{id}/live", event.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.event.id").value(event.getId()))
                .andExpect(jsonPath("$.tatamis.length()").value(3))
                .andExpect(jsonPath("$.tatamis[0].number").value(1))
                .andExpect(jsonPath("$.tatamis[0].currentCombat.id").value(current.getId()))
                .andExpect(jsonPath("$.tatamis[0].currentCombat.tatamiNumber").value(1))
                .andExpect(jsonPath("$.tatamis[0].currentCombat.athlete1.lastName").value("Benali"))
                .andExpect(jsonPath("$.tatamis[0].currentCombat.athlete2.club").value("CR Belouizdad"))
                .andExpect(jsonPath("$.tatamis[0].upcomingCombats.length()").value(1))
                .andExpect(jsonPath("$.tatamis[0].upcomingCombats[0].id").value(next.getId()))
                .andExpect(jsonPath("$.tatamis[0].upcomingCombats[0].athlete1.firstName").value("Amir"))
                .andExpect(jsonPath("$.tatamis[1].currentCombat").doesNotExist())
                .andExpect(jsonPath("$.tatamis[1].upcomingCombats[0].tatamiNumber").value(2))
                .andExpect(jsonPath("$.tatamis[2].upcomingCombats.length()").value(0));
    }

    @Test
    void tatamiLiveReturnsCurrentCombat() throws Exception {
        mockMvc.perform(get("/api/events/{e}/tatamis/{t}/live", event.getId(), tatami1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tatamiId").value(tatami1.getId()))
                .andExpect(jsonPath("$.currentCombat.athlete1.lastName").value("Benali"))
                .andExpect(jsonPath("$.upcomingCombats[0].athlete2.lastName").value("Benali"));
    }

    @Test
    void eventCombatsListIncludesTatamiAndAthletes() throws Exception {
        mockMvc.perform(get("/api/events/{id}/combats", event.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].combatNumber").value(1))
                .andExpect(jsonPath("$[0].tatamiNumber").value(1))
                .andExpect(jsonPath("$[0].athlete1.lastName").value("Benali"))
                .andExpect(jsonPath("$[2].tatamiNumber").value(2))
                .andExpect(jsonPath("$[2].athlete2.lastName").value("Kaci"));
    }

    @Test
    void singleCombatIncludesTatamiAndAthletes() throws Exception {
        mockMvc.perform(get("/api/combats/{id}", current.getId()).cookie(adminCookie()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tatamiNumber").value(1))
                .andExpect(jsonPath("$.athlete1.lastName").value("Benali"))
                .andExpect(jsonPath("$.athlete2.lastName").value("Khelifi"));
    }

    @Test
    void eventTatamisList() throws Exception {
        mockMvc.perform(get("/api/events/{id}/tatamis", event.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].eventId").value(event.getId()))
                .andExpect(jsonPath("$[0].name").value("Tapis 1"));
    }

    @Test
    void eventLiveHasNoNPlusOneQueries() throws Exception {
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.clear();

        mockMvc.perform(get("/api/events/{id}/live", event.getId())).andExpect(status().isOk());

        // 1 event + 1 tatami list + 2 per tatami (current + upcoming, fetch-joined) = 8 for 3 tatamis
        assertThat(stats.getPrepareStatementCount()).isLessThanOrEqualTo(8);
    }

    @Test
    void liveResponsesAreBrieflyCacheableAndCarryGeneratedAt() throws Exception {
        java.time.OffsetDateTime before = java.time.OffsetDateTime.now().minusSeconds(1);
        String body = mockMvc.perform(get("/api/events/{id}/live", event.getId()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=5, public"))
                .andExpect(header().doesNotExist("Pragma"))
                .andExpect(header().doesNotExist("Expires"))
                .andExpect(jsonPath("$.generatedAt").exists())
                .andReturn().getResponse().getContentAsString();
        java.time.OffsetDateTime generatedAt = java.time.OffsetDateTime.parse(
                objectMapper.readTree(body).get("generatedAt").asText());
        assertThat(generatedAt).isAfter(before);

        mockMvc.perform(get("/api/events/{e}/tatamis/{t}/live", event.getId(), tatami1.getId()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "max-age=5, public"));
    }

    @Test
    void otherEndpointsStayUncached() throws Exception {
        mockMvc.perform(get("/api/events/{id}/combats", event.getId()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-cache")));
    }
}
