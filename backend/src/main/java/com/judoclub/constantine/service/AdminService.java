package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.UserDto;
import com.judoclub.constantine.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final MapperService mapper;

    public List<UserDto> users() {
        return userRepository.findAll().stream().map(mapper::user).toList();
    }
}
