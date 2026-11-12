package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Combat;
import com.judoclub.constantine.entity.CombatStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Read queries fetch-join the tatami and both athletes, which {@code MapperService.combat()} always reads.
 */
public interface CombatRepository extends JpaRepository<Combat, Long> {
    @EntityGraph(attributePaths = {"tatami", "athlete1", "athlete2"})
    List<Combat> findByEventIdOrderByCombatNumberAsc(Long eventId);

    @EntityGraph(attributePaths = {"tatami", "athlete1", "athlete2"})
    Optional<Combat> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"tatami", "athlete1", "athlete2"})
    Optional<Combat> findFirstByTatami_IdAndStatusOrderByCombatNumberAsc(Long tatamiId, CombatStatus status);

    /** Next fight to start on a tatami: earliest scheduled (nulls last), then lowest number. */
    Optional<Combat> findFirstByTatami_IdAndStatusOrderByScheduledStartTimeAscCombatNumberAsc(Long tatamiId, CombatStatus status);

    boolean existsByTatami_IdAndStatusAndIdNot(Long tatamiId, CombatStatus status, Long id);

    @EntityGraph(attributePaths = {"tatami", "athlete1", "athlete2"})
    List<Combat> findTop5ByTatami_IdAndStatusOrderByScheduledStartTimeAscCombatNumberAsc(Long tatamiId, CombatStatus status);
}
