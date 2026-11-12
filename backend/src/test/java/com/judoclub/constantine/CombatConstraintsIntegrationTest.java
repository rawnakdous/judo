package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** V8: unique combat number per event, at most one IN_PROGRESS combat per tatami. */
class CombatConstraintsIntegrationTest extends AbstractIntegrationTest {

    private Event event;
    private Tatami tatami1;
    private Tatami tatami2;
    private Athlete a1;
    private Athlete a2;

    @BeforeEach
    void setUp() {
        event = data.liveEvent();
        List<Tatami> tatamis = data.tatamisOf(event);
        tatami1 = tatamis.get(0);
        tatami2 = tatamis.get(1);
        a1 = data.athlete("Yacine", "Benali", "JCC");
        a2 = data.athlete("Rayan", "Khelifi", "CRB");
    }

    private Map<String, Object> combatRequest(long tatamiId, int number) {
        Map<String, Object> c = new HashMap<>();
        c.put("eventId", event.getId());
        c.put("tatamiId", tatamiId);
        c.put("athlete1Id", a1.getId());
        c.put("athlete2Id", a2.getId());
        c.put("combatNumber", number);
        c.put("weightCategory", "-66 kg");
        c.put("ageCategory", "Seniors");
        c.put("status", "UPCOMING");
        return c;
    }

    @Test
    void duplicateCombatNumberInSameEventReturns409() throws Exception {
        data.combat(event, tatami1, a1, a2, 7, CombatStatus.UPCOMING);

        mockMvc.perform(post("/api/combats").cookie(adminCookie()).contentType(MediaType.APPLICATION_JSON)
                        .content(json(combatRequest(tatami2.getId(), 7))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ce numéro de combat existe déjà pour cet événement"));
    }

    @Test
    void sameCombatNumberInAnotherEventIsAllowed() throws Exception {
        data.combat(event, tatami1, a1, a2, 7, CombatStatus.UPCOMING);
        Event other = data.liveEvent();
        Map<String, Object> request = combatRequest(data.tatamisOf(other).get(0).getId(), 7);
        request.put("eventId", other.getId());

        mockMvc.perform(post("/api/combats").cookie(adminCookie()).contentType(MediaType.APPLICATION_JSON)
                        .content(json(request)))
                .andExpect(status().isOk());
    }

    @Test
    void secondInProgressCombatOnSameTatamiIsRejectedByTheDatabase() {
        data.combat(event, tatami1, a1, a2, 1, CombatStatus.IN_PROGRESS);

        assertThatThrownBy(() -> data.combat(event, tatami1, a2, a1, 2, CombatStatus.IN_PROGRESS))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void inProgressCombatsOnDifferentTatamisAreAllowed() {
        data.combat(event, tatami1, a1, a2, 1, CombatStatus.IN_PROGRESS);
        data.combat(event, tatami2, a2, a1, 2, CombatStatus.IN_PROGRESS);
    }

    @Test
    void startingASecondCombatOnSameTatamiReturns409() throws Exception {
        data.combat(event, tatami1, a1, a2, 1, CombatStatus.IN_PROGRESS);
        Combat upcoming = data.combat(event, tatami1, a2, a1, 2, CombatStatus.UPCOMING);

        mockMvc.perform(post("/api/combats/{id}/start", upcoming.getId()).cookie(adminCookie()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Un combat est déjà en cours sur ce tapis"));
    }
}
