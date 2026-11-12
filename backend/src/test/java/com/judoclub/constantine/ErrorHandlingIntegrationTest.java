package com.judoclub.constantine;

import com.judoclub.constantine.entity.Athlete;
import com.judoclub.constantine.entity.CombatStatus;
import com.judoclub.constantine.entity.Event;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Every failure must map to the right HTTP status with a French JSON body {status, message, timestamp}. */
class ErrorHandlingIntegrationTest extends AbstractIntegrationTest {

    @Test
    void validationErrorReturns400WithAllFieldErrorsInFrench() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "pas-un-email", "password", "court"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message", notNullValue()))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.errors.length()").value(4)) // firstName, lastName, email, password
                .andExpect(jsonPath("$.errors[?(@.field == 'firstName')].message").value("Le prénom est obligatoire"));
    }

    @Test
    void malformedJsonReturns400() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Corps de la requête invalide ou mal formé"));
    }

    @Test
    void pathTypeMismatchReturns400() throws Exception {
        mockMvc.perform(get("/api/events/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Valeur invalide pour le paramètre « id »"));
    }

    @Test
    void businessBadRequestKeepsItsMessage() throws Exception {
        mockMvc.perform(post("/api/events").cookie(adminCookie()).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "title", "Tournoi", "description", "d", "location", "Constantine",
                                "organizerName", "JCC",
                                "startDatetime", "2026-12-02T10:00:00+01:00",
                                "endDatetime", "2026-12-01T10:00:00+01:00"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La date de fin doit être postérieure à la date de début"));
    }

    @Test
    void missingEntityReturns404() throws Exception {
        mockMvc.perform(get("/api/events/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Événement introuvable"));
    }

    @Test
    void unknownRouteReturns404() throws Exception {
        mockMvc.perform(get("/api/events/1/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Ressource introuvable"));
    }

    @Test
    void wrongMethodReturns405() throws Exception {
        mockMvc.perform(get("/api/auth/login"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.message", containsString("GET")));
    }

    @Test
    void unsupportedContentTypeReturns415() throws Exception {
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.TEXT_PLAIN).content("x"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void duplicateEmailReturns409() throws Exception {
        data.userIfMissing("taken@test.local", "Password123!");
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B",
                                "email", "TAKEN@test.local", "password", "Password123!"))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Cette adresse e-mail est déjà utilisée"));
    }

    @Test
    void deletingReferencedAthleteReturns409() throws Exception {
        Event event = data.liveEvent();
        Athlete a1 = data.athlete("Yacine", "Benali", "JCC");
        Athlete a2 = data.athlete("Rayan", "Khelifi", "CRB");
        data.combat(event, data.tatamisOf(event).get(0), a1, a2, 1, CombatStatus.UPCOMING);

        mockMvc.perform(delete("/api/athletes/{id}", a1.getId()).cookie(adminCookie()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Impossible de supprimer : cet athlète a des combats"));
    }

    @Test
    void anonymousOnProtectedEndpointReturns401Json() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentification requise"));

        mockMvc.perform(post("/api/athletes").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void wrongPasswordReturns401() throws Exception {
        data.userIfMissing("someone@test.local", "Password123!");
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("email", "someone@test.local", "password", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Identifiants invalides"));
    }

    @Test
    void nonAdminOnAdminEndpointReturns403Json() throws Exception {
        mockMvc.perform(get("/api/admin/users").cookie(userCookie()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Accès refusé"));

        mockMvc.perform(post("/api/athletes").cookie(userCookie()).contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("firstName", "A", "lastName", "B", "club", "C"))))
                .andExpect(status().isForbidden());
    }
}
