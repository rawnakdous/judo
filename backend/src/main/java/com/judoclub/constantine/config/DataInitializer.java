package com.judoclub.constantine.config;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

/** Demo data for local development only (dev profile + app.seed.enabled). Never runs in prod or tests. */
@Configuration
@Profile("dev")
@RequiredArgsConstructor
public class DataInitializer {
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.enabled:false}")
    private boolean seedEnabled;

    @Bean
    @Order(2) // after AdminBootstrap
    CommandLineRunner seed(UserRepository users, EventRepository events, TatamiRepository tatamis, AthleteRepository athletes, CombatRepository combats) {
        return args -> {
            if (!seedEnabled) return;
            users.findByEmailIgnoreCase("yacine@example.com").orElseGet(() -> users.save(User.builder()
                    .firstName("Yacine").lastName("B.").email("yacine@example.com")
                    .passwordHash(passwordEncoder.encode("User12345!")).role(Role.USER).build()));

            if (events.count() > 0) return;
            Event event = Event.builder()
                    .title("Championnat National Seniors 2025")
                    .description("Le Championnat National Seniors 2025 réunit les meilleurs judokas d'Algérie pour plusieurs journées de compétition intense.")
                    .imageUrl("https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=80")
                    .location("Constantine, Algérie")
                    .organizerName("Judo Club Constantine")
                    .startDatetime(OffsetDateTime.of(2025, 5, 25, 9, 0, 0, 0, ZoneOffset.ofHours(1)))
                    .endDatetime(OffsetDateTime.of(2027, 5, 28, 17, 0, 0, 0, ZoneOffset.ofHours(1)))
                    .build();
            Event savedEvent = events.save(event);

            Tatami t1 = tatamis.save(Tatami.builder().event(savedEvent).number(1).name("Tapis 1").liveUrl("https://www.youtube.com/live/dQw4w9WgXcQ").active(true).build());
            Tatami t2 = tatamis.save(Tatami.builder().event(savedEvent).number(2).name("Tapis 2").liveUrl("https://www.youtube.com/live/dQw4w9WgXcQ").active(true).build());
            Tatami t3 = tatamis.save(Tatami.builder().event(savedEvent).number(3).name("Tapis 3").liveUrl("https://www.youtube.com/live/dQw4w9WgXcQ").active(false).build());

            Athlete a1 = athletes.save(Athlete.builder().firstName("Yacine").lastName("Benali").club("JS Bordj Bou Arréridj").country("Algérie").build());
            Athlete a2 = athletes.save(Athlete.builder().firstName("Rayan").lastName("Khelifi").club("CR Belouizdad").country("Algérie").build());
            Athlete a3 = athletes.save(Athlete.builder().firstName("Amir").lastName("Kaci").club("JCC").country("Algérie").build());
            Athlete a4 = athletes.save(Athlete.builder().firstName("Mourad").lastName("Ouali").club("USMA").country("Algérie").build());

            combats.save(Combat.builder().event(savedEvent).tatami(t1).athlete1(a1).athlete2(a2).combatNumber(25).weightCategory("-66 kg").ageCategory("Seniors").status(CombatStatus.IN_PROGRESS).scheduledStartTime(OffsetDateTime.now()).actualStartTime(OffsetDateTime.now()).build());
            combats.save(Combat.builder().event(savedEvent).tatami(t1).athlete1(a3).athlete2(a4).combatNumber(26).weightCategory("-73 kg").ageCategory("Seniors").status(CombatStatus.UPCOMING).scheduledStartTime(OffsetDateTime.now().plusMinutes(20)).build());
            combats.save(Combat.builder().event(savedEvent).tatami(t2).athlete1(a2).athlete2(a3).combatNumber(31).weightCategory("-81 kg").ageCategory("Seniors").status(CombatStatus.IN_PROGRESS).scheduledStartTime(OffsetDateTime.now()).actualStartTime(OffsetDateTime.now()).build());
            combats.save(Combat.builder().event(savedEvent).tatami(t3).athlete1(a4).athlete2(a1).combatNumber(42).weightCategory("-90 kg").ageCategory("Seniors").status(CombatStatus.UPCOMING).scheduledStartTime(OffsetDateTime.now().plusMinutes(15)).build());
        };
    }
}
