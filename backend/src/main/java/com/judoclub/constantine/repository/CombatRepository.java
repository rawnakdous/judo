package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Combat;
import com.judoclub.constantine.entity.CombatStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CombatRepository extends JpaRepository<Combat, Long> {
    List<Combat> findByEventIdOrderByCombatNumberAsc(Long eventId);
    Optional<Combat> findFirstByTatami_IdAndStatusOrderByCombatNumberAsc(Long tatamiId, CombatStatus status);
    List<Combat> findTop5ByTatami_IdAndStatusOrderByScheduledStartTimeAscCombatNumberAsc(Long tatamiId, CombatStatus status);
}
