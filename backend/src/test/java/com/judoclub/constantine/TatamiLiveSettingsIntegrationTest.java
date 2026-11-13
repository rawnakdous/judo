package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.repository.TatamiRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** PUT /api/events/{e}/tatamis/{t}/live only changes the stream settings (liveUrl, active). */
class TatamiLiveSettingsIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private CombatRepository combatRepository;
    @Autowired
    private TatamiRepository tatamiRepository;

    private Cookie admin;
    private Event event;
    private Tatami tatami1;
    private Tatami tatami2;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminCookie();
        event = data.liveEvent();
        List<Tatami> tatamis = data.tatamisOf(event);
        tatami1 = tatamis.get(0);
        tatami2 = tatamis.get(1);
    }

    private org.springframework.test.web.servlet.ResultActions update(Event e, Tatami t, Object body) throws Exception {
        return mockMvc.perform(put("/api/events/{e}/tatamis/{t}/live", e.getId(), t.getId())
                .cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(body)));
    }

    @Test
    void updatesAndNormalisesLiveUrlAndActiveFlag() throws Exception {
        update(event, tatami1, Map.of("liveUrl", "https://www.youtube.com/watch?v=abc_DEF-123", "active", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liveUrl").value("https://www.youtube.com/live/abc_DEF-123"))
                .andExpect(jsonPath("$.active").value(false));
        assertThat(tatamiRepository.findById(tatami1.getId()).orElseThrow().isActive()).isFalse();
    }

    @Test
    void emptyLiveUrlClearsIt() throws Exception {
        update(event, tatami1, Map.of("liveUrl", "", "active", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liveUrl").value(nullValue()));
    }

    @Test
    void nonYoutubeUrlReturns400() throws Exception {
        update(event, tatami1, Map.of("liveUrl", "https://example.com/live/abc_DEF-123", "active", true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le lien YouTube Live est invalide"));
    }

    @Test
    void legacyCurrentCombatIdIsIgnored() throws Exception {
        Athlete a1 = data.athlete("Yacine", "Benali", "JCC");
        Athlete a2 = data.athlete("Rayan", "Khelifi", "CRB");
        // a combat from another tatami: the old endpoint would have moved it here and set it IN_PROGRESS
        Combat other = data.combat(event, tatami2, a1, a2, 1, CombatStatus.UPCOMING);

        update(event, tatami1, Map.of("liveUrl", "https://youtu.be/abc_DEF-123", "active", true, "currentCombatId", other.getId()))
                .andExpect(status().isOk());

        Combat reloaded = combatRepository.findById(other.getId()).orElseThrow();
        assertThat(reloaded.getStatus()).isEqualTo(CombatStatus.UPCOMING);
        assertThat(reloaded.getTatami().getId()).isEqualTo(tatami2.getId());
    }

    @Test
    void tatamiOfAnotherEventReturns404() throws Exception {
        Event other = data.liveEvent();
        update(other, tatami1, Map.of("liveUrl", "", "active", true))
                .andExpect(status().isNotFound());
    }

    @Test
    void requiresAdmin() throws Exception {
        mockMvc.perform(put("/api/events/{e}/tatamis/{t}/live", event.getId(), tatami1.getId())
                        .cookie(userCookie()).contentType(MediaType.APPLICATION_JSON).content("{\"active\":true}"))
                .andExpect(status().isForbidden());
    }
}
