package com.judoclub.constantine.dto;

import com.judoclub.constantine.entity.Role;

import java.time.Instant;

public record UserDto(Long id, String firstName, String lastName, String email, Role role, String profileImageUrl, Instant createdAt) {
}
