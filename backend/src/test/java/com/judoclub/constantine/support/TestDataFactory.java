package com.judoclub.constantine.support;

import com.judoclub.constantine.entity.*;
import com.judoclub.constantine.repository.*;
import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Builds test data directly through repositories. Imported by {@link AbstractIntegrationTest}.
 */
@TestComponent
public class TestDataFactory {
    private final UserRepository users;
    private final EventRepository events;
    private final TatamiRepository tatamis;
    private final AthleteRepository athletes;
    private final CombatRepository combats;
    private final PasswordEncoder passwordEncoder;

    public TestDataFactory(UserRepository users, EventRepository events, TatamiRepository tatamis,
                           AthleteRepository athletes, CombatRepository combats, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.events = events;
        this.tatamis = tatamis;
        this.athletes = athletes;
        this.combats = combats;
        this.passwordEncoder = passwordEncoder;
    }

    public User adminIfMissing(String email, String password) {
        return userIfMissing(email, password, Role.ADMIN);
    }

    public User userIfMissing(String email, String password) {
        return userIfMissing(email, password, Role.USER);
    }

    private User userIfMissing(String email, String password, Role role) {
        return users.findByEmailIgnoreCase(email).orElseGet(() -> users.save(User.builder()
                .firstName(role == Role.ADMIN ? "Admin" : "User")
                .lastName("Test")
                .email(email.toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .role(role)
                .build()));
    }

    /** An event running from {@code start} to {@code end}, with {@code tatamiCount} active tatamis numbered from 1. */
    public Event event(String title, OffsetDateTime start, OffsetDateTime end, int tatamiCount) {
        Event event = Event.builder()
                .title(title)
                .description("Description de " + title)
                .location("Constantine, Algérie")
                .organizerName("Judo Club Constantine")
                .startDatetime(start)
                .endDatetime(end)
                .build();
        for (int i = 1; i <= tatamiCount; i++) {
            event.getTatamis().add(Tatami.builder()
                    .event(event)
                    .number(i)
                    .name("Tapis " + i)
                    .liveUrl("https://www.youtube.com/live/abcdef" + i)
                    .active(true)
                    .build());
        }
        return events.save(event);
    }

    /** A live event (started an hour ago, ends in an hour) with 3 tatamis. */
    public Event liveEvent() {
        OffsetDateTime now = OffsetDateTime.now();
        return event("Championnat Test", now.minusHours(1), now.plusHours(1), 3);
    }

    public List<Tatami> tatamisOf(Event event) {
        return tatamis.findByEventIdOrderByNumberAsc(event.getId());
    }

    public Athlete athlete(String firstName, String lastName, String club) {
        return athletes.save(Athlete.builder()
                .firstName(firstName)
                .lastName(lastName)
                .club(club)
                .country("Algérie")
                .build());
    }

    public Combat combat(Event event, Tatami tatami, Athlete athlete1, Athlete athlete2, int number, CombatStatus status) {
        OffsetDateTime now = OffsetDateTime.now();
        return combats.save(Combat.builder()
                .event(event)
                .tatami(tatami)
                .athlete1(athlete1)
                .athlete2(athlete2)
                .combatNumber(number)
                .weightCategory("-66 kg")
                .ageCategory("Seniors")
                .status(status)
                .scheduledStartTime(now.plusMinutes(number))
                .actualStartTime(status == CombatStatus.UPCOMING ? null : now)
                .actualEndTime(status == CombatStatus.FINISHED ? now : null)
                .build());
    }
}
