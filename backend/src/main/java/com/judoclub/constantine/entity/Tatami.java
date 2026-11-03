package com.judoclub.constantine.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "tatamis", uniqueConstraints = @UniqueConstraint(name = "uk_tatami_event_number", columnNames = {"event_id", "number"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tatami {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private Integer number;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(name = "live_url", length = 500)
    private String liveUrl;

    @Column(name = "is_active", nullable = false)
    private boolean active;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
