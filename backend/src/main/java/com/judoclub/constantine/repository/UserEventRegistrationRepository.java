package com.judoclub.constantine.repository;

import com.judoclub.constantine.entity.UserEventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserEventRegistrationRepository extends JpaRepository<UserEventRegistration, Long> {
    List<UserEventRegistration> findByUserId(Long userId);
}
