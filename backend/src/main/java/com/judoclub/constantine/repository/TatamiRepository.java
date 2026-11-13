package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Tatami;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TatamiRepository extends JpaRepository<Tatami, Long> {
    List<Tatami> findByEventIdOrderByNumberAsc(Long eventId);
    Optional<Tatami> findByEventIdAndId(Long eventId, Long id);

    /** Row lock that serialises concurrent "next combat" calls on the same tatami. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tatami t where t.event.id = :eventId and t.id = :id")
    Optional<Tatami> findForUpdate(@Param("eventId") Long eventId, @Param("id") Long id);
    Optional<Tatami> findByEventIdAndNumber(Long eventId, Integer number);
}
