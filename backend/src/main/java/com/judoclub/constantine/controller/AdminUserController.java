package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.UserDto;
import com.judoclub.constantine.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final AdminService adminService;

    @GetMapping
    public List<UserDto> users() {
        return adminService.users();
    }
}
