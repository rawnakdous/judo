package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** UPCOMING -> IN_PROGRESS -> FINISHED, reset -> UPCOMING; every other transition is 409. */
class CombatStateMachineIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private CombatRepository combatRepository;

    private Cookie admin;
    private Event event;
    private Tatami tatami1;
    private Tatami tatami2;
    private Athlete a1;
    private Athlete a2;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminCookie();
        event = data.liveEvent();
        List<Tatami> tatamis = data.tatamisOf(event);
        tatami1 = tatamis.get(0);
        tatami2 = tatamis.get(1);
        a1 = data.athlete("Yacine", "Benali", "JCC");
        a2 = data.athlete("Rayan", "Khelifi", "CRB");
    }

    private Combat combat(int number, CombatStatus status) {
        return data.combat(event, tatami1, a1, a2, number, status);
    }

    @Test
    void startUpcomingCombat() throws Exception {
        Combat c = combat(1, CombatStatus.UPCOMING);
        mockMvc.perform(post("/api/combats/{id}/start", c.getId()).cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.actualStartTime", notNullValue()))
                .andExpect(jsonPath("$.actualEndTime", nullValue()));
    }

    @Test
    void finishInProgressCombat() throws Exception {
        Combat c = combat(1, CombatStatus.IN_PROGRESS);
        mockMvc.perform(post("/api/combats/{id}/finish", c.getId()).cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FINISHED"))
                .andExpect(jsonPath("$.actualEndTime", notNullValue()));
    }

    @Test
    void resetFromAnyStateClearsTimes() throws Exception {
        for (CombatStatus from : CombatStatus.values()) {
            Combat c = combat(10 + from.ordinal(), from);
            mockMvc.perform(post("/api/combats/{id}/reset", c.getId()).cookie(admin))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("UPCOMING"))
                    .andExpect(jsonPath("$.actualStartTime", nullValue()))
                    .andExpect(jsonPath("$.actualEndTime", nullValue()));
        }
    }

    @Test
    void cannotStartInProgressOrFinishedCombat() throws Exception {
        Combat inProgress = combat(1, CombatStatus.IN_PROGRESS);
        Combat finished = combat(2, CombatStatus.FINISHED);
        for (Combat c : List.of(inProgress, finished)) {
            mockMvc.perform(post("/api/combats/{id}/start", c.getId()).cookie(admin))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Seul un combat à venir peut être démarré"));
        }
    }

    @Test
    void cannotFinishUpcomingOrFinishedCombat() throws Exception {
        Combat upcoming = combat(1, CombatStatus.UPCOMING);
        Combat finished = combat(2, CombatStatus.FINISHED);
        for (Combat c : List.of(upcoming, finished)) {
            mockMvc.perform(post("/api/combats/{id}/finish", c.getId()).cookie(admin))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message").value("Seul un combat en cours peut être terminé"));
        }
    }

    @Test
    void cannotStartWhileAnotherCombatIsInProgressOnSameTatami() throws Exception {
        combat(1, CombatStatus.IN_PROGRESS);
        Combat next = combat(2, CombatStatus.UPCOMING);
        mockMvc.perform(post("/api/combats/{id}/start", next.getId()).cookie(admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Un combat est déjà en cours sur ce tapis"));
        assertThat(combatRepository.findById(next.getId()).orElseThrow().getStatus()).isEqualTo(CombatStatus.UPCOMING);
    }

    @Test
    void canStartWhileAnotherTatamiHasACombatInProgress() throws Exception {
        data.combat(event, tatami2, a1, a2, 1, CombatStatus.IN_PROGRESS);
        Combat c = combat(2, CombatStatus.UPCOMING);
        mockMvc.perform(post("/api/combats/{id}/start", c.getId()).cookie(admin))
                .andExpect(status().isOk());
    }

    private Map<String, Object> request(int number, String status) {
        Map<String, Object> r = new HashMap<>();
        r.put("eventId", event.getId());
        r.put("tatamiId", tatami1.getId());
        r.put("athlete1Id", a1.getId());
        r.put("athlete2Id", a2.getId());
        r.put("combatNumber", number);
        r.put("weightCategory", "-73 kg");
        r.put("ageCategory", "Juniors");
        if (status != null) r.put("status", status); // legacy field: must be ignored
        return r;
    }

    @Test
    void createAlwaysProducesUpcomingCombat() throws Exception {
        mockMvc.perform(post("/api/combats").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(request(5, "IN_PROGRESS"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UPCOMING"));
        mockMvc.perform(post("/api/combats").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(request(6, null))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UPCOMING"));
    }

    @Test
    void updateNeverChangesStatus() throws Exception {
        Combat c = combat(1, CombatStatus.IN_PROGRESS);
        mockMvc.perform(put("/api/combats/{id}", c.getId()).cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(request(1, "FINISHED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.weightCategory").value("-73 kg"));
    }

    @Test
    void transitionsRequireAdmin() throws Exception {
        Combat c = combat(1, CombatStatus.UPCOMING);
        mockMvc.perform(post("/api/combats/{id}/start", c.getId()).cookie(userCookie()))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/combats/{id}/reset", c.getId()))
                .andExpect(status().isUnauthorized());
    }
}
