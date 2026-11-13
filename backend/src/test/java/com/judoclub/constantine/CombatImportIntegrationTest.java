package com.judoclub.constantine;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.AthleteRepository;
import com.judoclub.constantine.repository.CombatRepository;
import com.judoclub.constantine.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** POST /api/events/{id}/combats/import — CSV fight schedule, all-or-nothing. */
class CombatImportIntegrationTest extends AbstractIntegrationTest {
    private static final String HEADER = "combat_number,tatami_number,a1_first_name,a1_last_name,a1_club,a2_first_name,a2_last_name,a2_club,weight_category,age_category,scheduled_start\n";

    @Autowired
    private CombatRepository combats;
    @Autowired
    private AthleteRepository athletes;

    private Cookie admin;
    private Event event;

    @BeforeEach
    void setUp() throws Exception {
        admin = adminCookie();
        event = data.liveEvent(); // 3 tatamis
    }

    private ResultActions upload(String csv) throws Exception {
        return upload(csv.getBytes(StandardCharsets.UTF_8));
    }

    private ResultActions upload(byte[] bytes) throws Exception {
        return mockMvc.perform(multipart("/api/events/{id}/combats/import", event.getId())
                .file(new MockMultipartFile("file", "combats.csv", "text/csv", bytes))
                .cookie(admin));
    }

    private List<Combat> imported() {
        return combats.findByEventIdOrderByCombatNumberAsc(event.getId());
    }

    @Test
    void importsTheSampleFileIncludingArabicNamesAndQuotedFields() throws Exception {
        byte[] sample = Files.readAllBytes(Path.of("../docs/samples/combats-import.csv"));
        upload(sample)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(4))
                .andExpect(jsonPath("$.athletesCreated").value(8));

        List<Combat> list = imported();
        assertThat(list).extracting(Combat::getCombatNumber).containsExactly(1, 2, 3, 4);
        assertThat(list).allMatch(c -> c.getStatus() == CombatStatus.UPCOMING);
        Combat third = list.get(2);
        assertThat(third.getAthlete1().getFirstName()).isEqualTo("ياسين");
        assertThat(third.getAthlete1().getClub()).isEqualTo("نادي قسنطينة");
        assertThat(third.getAthlete2().getClub()).isEqualTo("MC Alger, section judo");
        assertThat(third.getTatami().getNumber()).isEqualTo(2);
        // "2026-12-20 09:00" is Algiers time (UTC+1)
        assertThat(list.get(0).getScheduledStartTime().toInstant()).isEqualTo(OffsetDateTime.parse("2026-12-20T08:00:00Z").toInstant());
        assertThat(list.get(3).getScheduledStartTime()).isNull();
    }

    @Test
    void reusesExistingAthletesCaseInsensitivelyAndDedupesWithinTheFile() throws Exception {
        data.athlete("Yacine", "Benali", "JCC");
        upload(HEADER
                + "1,1,  YACINE , benali ,jcc,Rayan,Khelifi,CRB,-66 kg,Seniors,\n"
                + "2,2,Rayan,Khelifi,crb,Amir,Kaci,JCC,-66 kg,Seniors,\n")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.created").value(2))
                .andExpect(jsonPath("$.athletesCreated").value(2)); // Rayan + Amir; Yacine reused, Rayan created once
        assertThat(athletes.count()).isEqualTo(3);
    }

    @Test
    void acceptsSemicolonsBomAndCrlfFromExcel() throws Exception {
        String csv = "﻿" + HEADER.replace(',', ';').replace("\n", "\r\n")
                + "7;3;Nadia;Saidi;JCC;Lina;Meziane;ASM Oran;-57 kg;Seniors;20/12/2026 14:30\r\n";
        upload(csv).andExpect(status().isOk()).andExpect(jsonPath("$.created").value(1));
        Combat combat = imported().get(0);
        assertThat(combat.getTatami().getNumber()).isEqualTo(3);
        assertThat(combat.getScheduledStartTime().toInstant()).isEqualTo(OffsetDateTime.parse("2026-12-20T13:30:00Z").toInstant());
    }

    @Test
    void oneBadRowRejectsTheWholeFileWithLineNumbers() throws Exception {
        upload(HEADER
                + "1,1,Yacine,Benali,JCC,Rayan,Khelifi,CRB,-66 kg,Seniors,\n"
                + "2,9,Amir,Kaci,JCC,Mourad,Ouali,USMA,-73 kg,Seniors,\n"            // line 3: no tatami 9
                + "1,2,Nadia,Saidi,JCC,Lina,Meziane,ASMO,-57 kg,Seniors,demain\n"    // line 4: duplicate number + bad date
                + "4,1,Sofiane,Haddad,MCA,sofiane,HADDAD,mca,-81 kg,,\n")            // line 5: same athlete + missing age
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("3 lignes invalides : aucun combat importé"))
                .andExpect(jsonPath("$.errors.length()").value(3))
                .andExpect(jsonPath("$.errors[0].row").value(3))
                .andExpect(jsonPath("$.errors[0].message").value("tapis 9 inexistant pour cet événement"))
                .andExpect(jsonPath("$.errors[1].row").value(4))
                .andExpect(jsonPath("$.errors[1].message", containsString("en double (déjà ligne 2)")))
                .andExpect(jsonPath("$.errors[1].message", containsString("scheduled_start invalide")))
                .andExpect(jsonPath("$.errors[2].row").value(5))
                .andExpect(jsonPath("$.errors[2].message", containsString("contre lui-même")))
                .andExpect(jsonPath("$.errors[2].message", containsString("catégorie d'âge manquant")));
        assertThat(imported()).isEmpty();
        assertThat(athletes.count()).isZero();
    }

    @Test
    void rejectsNumbersAlreadyUsedInTheEvent() throws Exception {
        Athlete a = data.athlete("A", "A", "X");
        Athlete b = data.athlete("B", "B", "X");
        data.combat(event, data.tatamisOf(event).get(0), a, b, 5, CombatStatus.UPCOMING);
        upload(HEADER + "5,1,Yacine,Benali,JCC,Rayan,Khelifi,CRB,-66 kg,Seniors,\n")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].message").value("le combat n°5 existe déjà pour cet événement"));
    }

    @Test
    void fileLevelProblemsReturnClearMessages() throws Exception {
        upload("").andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Le fichier est vide"));
        upload("combat_number,tatami_number\n1,1\n")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Colonnes manquantes : a1_first_name")));
        upload(HEADER).andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Le fichier ne contient aucun combat"));
        upload(new byte[]{'c', ',', (byte) 0xC3, (byte) 0x28, '\n'})
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("UTF-8")));
    }

    @Test
    void missingFilePartAndNonAdminAreRejected() throws Exception {
        mockMvc.perform(multipart("/api/events/{id}/combats/import", event.getId()).cookie(admin))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Fichier obligatoire manquant : file"));
        mockMvc.perform(multipart("/api/events/{id}/combats/import", event.getId())
                        .file(new MockMultipartFile("file", "c.csv", "text/csv", HEADER.getBytes()))
                        .cookie(userCookie()))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownEventReturns404() throws Exception {
        mockMvc.perform(multipart("/api/events/{id}/combats/import", 999999)
                        .file(new MockMultipartFile("file", "c.csv", "text/csv", HEADER.getBytes()))
                        .cookie(admin))
                .andExpect(status().isNotFound());
    }
}
