package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** POST /api/events/{e}/tatamis/{t}/next — the one-tap "Combat suivant" operation. */
class NextCombatIntegrationTest extends AbstractIntegrationTest {

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

    private Combat combat(Tatami tatami, int number, CombatStatus status) {
        return data.combat(event, tatami, a1, a2, number, status);
    }

    private ResultActions next(Tatami tatami, Long expectedCurrentCombatId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("expectedCurrentCombatId", expectedCurrentCombatId);
        return mockMvc.perform(post("/api/events/{e}/tatamis/{t}/next", event.getId(), tatami.getId())
                .cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(body)));
    }

    private CombatStatus statusOf(Combat c) {
        return combatRepository.findById(c.getId()).orElseThrow().getStatus();
    }

    @Test
    void finishesCurrentAndStartsNextUpcoming() throws Exception {
        Combat current = combat(tatami1, 1, CombatStatus.IN_PROGRESS);
        Combat second = combat(tatami1, 2, CombatStatus.UPCOMING);
        Combat third = combat(tatami1, 3, CombatStatus.UPCOMING);

        next(tatami1, current.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tatamiId").value(tatami1.getId()))
                .andExpect(jsonPath("$.currentCombat.id").value(second.getId()))
                .andExpect(jsonPath("$.currentCombat.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.upcomingCombats.length()").value(1))
                .andExpect(jsonPath("$.upcomingCombats[0].id").value(third.getId()));

        Combat finished = combatRepository.findById(current.getId()).orElseThrow();
        assertThat(finished.getStatus()).isEqualTo(CombatStatus.FINISHED);
        assertThat(finished.getActualEndTime()).isNotNull();
        assertThat(combatRepository.findById(second.getId()).orElseThrow().getActualStartTime()).isNotNull();
    }

    @Test
    void withNoCurrentCombatStartsFirstUpcoming() throws Exception {
        Combat first = combat(tatami1, 1, CombatStatus.UPCOMING);
        combat(tatami1, 2, CombatStatus.UPCOMING);

        next(tatami1, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentCombat.id").value(first.getId()));
    }

    @Test
    void lastCombatLeavesTatamiEmpty() throws Exception {
        Combat last = combat(tatami1, 1, CombatStatus.IN_PROGRESS);

        next(tatami1, last.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentCombat").doesNotExist())
                .andExpect(jsonPath("$.upcomingCombats.length()").value(0));
        assertThat(statusOf(last)).isEqualTo(CombatStatus.FINISHED);
    }

    @Test
    void emptyTatamiWithNothingScheduledIsANoOp() throws Exception {
        next(tatami1, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentCombat").doesNotExist());
    }

    @Test
    void staleExpectedIdReturns409WithCurrentStateAndChangesNothing() throws Exception {
        Combat finishedEarlier = combat(tatami1, 1, CombatStatus.FINISHED);
        Combat current = combat(tatami1, 2, CombatStatus.IN_PROGRESS);
        Combat upcoming = combat(tatami1, 3, CombatStatus.UPCOMING);

        // e.g. the operator's retry after the first tap already went through
        next(tatami1, finishedEarlier.getId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Le tapis a déjà été mis à jour"))
                .andExpect(jsonPath("$.tatami.currentCombat.id").value(current.getId()))
                .andExpect(jsonPath("$.tatami.upcomingCombats[0].id").value(upcoming.getId()));

        // expecting "no current combat" while one is running is also stale
        next(tatami1, null).andExpect(status().isConflict());

        assertThat(statusOf(current)).isEqualTo(CombatStatus.IN_PROGRESS);
        assertThat(statusOf(upcoming)).isEqualTo(CombatStatus.UPCOMING);
    }

    @Test
    void doesNotTouchOtherTatamis() throws Exception {
        Combat current1 = combat(tatami1, 1, CombatStatus.IN_PROGRESS);
        Combat current2 = combat(tatami2, 2, CombatStatus.IN_PROGRESS);
        Combat upcoming2 = combat(tatami2, 3, CombatStatus.UPCOMING);

        next(tatami1, current1.getId()).andExpect(status().isOk());

        assertThat(statusOf(current2)).isEqualTo(CombatStatus.IN_PROGRESS);
        assertThat(statusOf(upcoming2)).isEqualTo(CombatStatus.UPCOMING);
    }

    @Test
    void ordersByScheduledTimeThenNumberWithUnscheduledLast() throws Exception {
        Combat unscheduled = combat(tatami1, 1, CombatStatus.UPCOMING);
        unscheduled.setScheduledStartTime(null);
        combatRepository.save(unscheduled);
        Combat scheduled = combat(tatami1, 5, CombatStatus.UPCOMING);

        next(tatami1, null).andExpect(jsonPath("$.currentCombat.id").value(scheduled.getId()));
        next(tatami1, scheduled.getId()).andExpect(jsonPath("$.currentCombat.id").value(unscheduled.getId()));
    }

    @Test
    void tatamiOfAnotherEventReturns404() throws Exception {
        Event other = data.liveEvent();
        mockMvc.perform(post("/api/events/{e}/tatamis/{t}/next", other.getId(), tatami1.getId())
                        .cookie(admin).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void requiresAdmin() throws Exception {
        mockMvc.perform(post("/api/events/{e}/tatamis/{t}/next", event.getId(), tatami1.getId())
                        .cookie(userCookie()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void concurrentDoubleTapAdvancesOnlyOnce() throws Exception {
        Combat current = combat(tatami1, 1, CombatStatus.IN_PROGRESS);
        Combat second = combat(tatami1, 2, CombatStatus.UPCOMING);
        Combat third = combat(tatami1, 3, CombatStatus.UPCOMING);

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch go = new CountDownLatch(1);
        Callable<Integer> tap = () -> {
            go.await();
            return next(tatami1, current.getId()).andReturn().getResponse().getStatus();
        };
        Future<Integer> f1 = pool.submit(tap);
        Future<Integer> f2 = pool.submit(tap);
        go.countDown();
        List<Integer> statuses = List.of(f1.get(30, TimeUnit.SECONDS), f2.get(30, TimeUnit.SECONDS));
        pool.shutdown();

        assertThat(statuses).containsExactlyInAnyOrder(200, 409);
        assertThat(statusOf(current)).isEqualTo(CombatStatus.FINISHED);
        assertThat(statusOf(second)).isEqualTo(CombatStatus.IN_PROGRESS);
        assertThat(statusOf(third)).isEqualTo(CombatStatus.UPCOMING);
    }
}
