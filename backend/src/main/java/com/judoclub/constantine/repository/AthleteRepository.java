package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Athlete;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AthleteRepository extends JpaRepository<Athlete, Long> {
    List<Athlete> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrClubContainingIgnoreCase(String firstName, String lastName, String club);
}
