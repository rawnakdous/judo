package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Tatami;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TatamiRepository extends JpaRepository<Tatami, Long> {
    List<Tatami> findByEventIdOrderByNumberAsc(Long eventId);
    Optional<Tatami> findByEventIdAndId(Long eventId, Long id);
    Optional<Tatami> findByEventIdAndNumber(Long eventId, Integer number);
}
