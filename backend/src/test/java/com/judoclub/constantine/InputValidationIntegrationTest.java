package com.judoclub.constantine;

import com.judoclub.constantine.entity.Athlete;
import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Request validation matches the DB column limits and fails with 400 + French messages, never 500. */
class InputValidationIntegrationTest extends AbstractIntegrationTest {

    private Cookie admin;

    @BeforeEach
    void login() throws Exception {
        admin = adminCookie();
    }

    private Map<String, Object> event() {
        Map<String, Object> e = new HashMap<>();
        e.put("title", "Tournoi");
        e.put("description", "Description");
        e.put("location", "Constantine");
        e.put("organizerName", "JCC");
        e.put("startDatetime", "2026-12-01T09:00:00+01:00");
        e.put("endDatetime", "2026-12-01T18:00:00+01:00");
        return e;
    }

    @Test
    void oversizedTitleReturns400() throws Exception {
        Map<String, Object> e = event();
        e.put("title", "x".repeat(181));
        mockMvc.perform(post("/api/events").cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(e)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le titre ne doit pas dépasser 180 caractères"))
                .andExpect(jsonPath("$.errors[0].field").value("title"));
    }

    @Test
    void nonHttpImageUrlReturns400() throws Exception {
        Map<String, Object> e = event();
        e.put("imageUrl", "javascript:alert(1)");
        mockMvc.perform(post("/api/events").cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(e)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le lien de l'image doit commencer par http:// ou https://"));
    }

    @Test
    void emptyImageUrlIsAcceptedAndStoredAsNull() throws Exception {
        Map<String, Object> e = event();
        e.put("imageUrl", "");
        mockMvc.perform(post("/api/events").cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(e)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value(nullValue()));
    }

    @Test
    void oversizedAthleteClubReturns400AndBlankOptionalsBecomeNull() throws Exception {
        mockMvc.perform(post("/api/athletes").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B", "club", "c".repeat(161)))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le club ne doit pas dépasser 160 caractères"));

        mockMvc.perform(post("/api/athletes").cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B", "club", "JCC", "country", " ", "profileImageUrl", ""))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value(nullValue()))
                .andExpect(jsonPath("$.profileImageUrl").value(nullValue()));
    }

    @Test
    void sameAthleteTwiceReturns400() throws Exception {
        Event event = data.liveEvent();
        Athlete athlete = data.athlete("Yacine", "Benali", "JCC");
        Map<String, Object> combat = new HashMap<>();
        combat.put("eventId", event.getId());
        combat.put("tatamiId", data.tatamisOf(event).get(0).getId());
        combat.put("athlete1Id", athlete.getId());
        combat.put("athlete2Id", athlete.getId());
        combat.put("combatNumber", 1);
        combat.put("weightCategory", "-66 kg");
        combat.put("ageCategory", "Seniors");
        combat.put("status", "UPCOMING");

        mockMvc.perform(post("/api/combats").cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(combat)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Un athlète ne peut pas combattre contre lui-même"));
    }

    @Test
    void nonPositiveCombatNumberAndOversizedWeightCategoryReturn400() throws Exception {
        Map<String, Object> combat = new HashMap<>();
        combat.put("eventId", 1);
        combat.put("tatamiId", 1);
        combat.put("athlete1Id", 1);
        combat.put("athlete2Id", 2);
        combat.put("combatNumber", 0);
        combat.put("weightCategory", "w".repeat(41));
        combat.put("ageCategory", "Seniors");
        combat.put("status", "UPCOMING");

        mockMvc.perform(post("/api/combats").cookie(admin).contentType(MediaType.APPLICATION_JSON).content(json(combat)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.length()").value(2));
    }

    @Test
    void oversizedLiveUrlReturns400() throws Exception {
        Event event = data.liveEvent();
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/events/{e}/tatamis/{t}/live", event.getId(), data.tatamisOf(event).get(0).getId())
                        .cookie(admin).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("liveUrl", "https://youtu.be/" + "a".repeat(500), "active", true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le lien YouTube ne doit pas dépasser 500 caractères"));
    }
}
