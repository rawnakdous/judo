package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}
