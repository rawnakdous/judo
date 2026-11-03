package com.judoclub.constantine.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.OffsetDateTime;

@Entity
@Table(name = "combats", indexes = {
        @Index(name = "idx_combats_event_tatami", columnList = "event_id,tatami_id"),
        @Index(name = "idx_combats_status", columnList = "status")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Combat {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tatami_id", nullable = false)
    private Tatami tatami;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_1_id", nullable = false)
    private Athlete athlete1;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "athlete_2_id", nullable = false)
    private Athlete athlete2;

    @Column(name = "combat_number", nullable = false)
    private Integer combatNumber;

    @Column(name = "weight_category", nullable = false, length = 40)
    private String weightCategory;

    @Column(name = "age_category", nullable = false, length = 80)
    private String ageCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CombatStatus status;

    @Column(name = "scheduled_start_time")
    private OffsetDateTime scheduledStartTime;

    @Column(name = "actual_start_time")
    private OffsetDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private OffsetDateTime actualEndTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
