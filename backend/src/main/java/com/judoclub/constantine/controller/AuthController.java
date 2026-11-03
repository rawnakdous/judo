package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.AuthDtos;
import com.judoclub.constantine.dto.UserDto;
import com.judoclub.constantine.security.CookieUtil;
import com.judoclub.constantine.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final CookieUtil cookieUtil;

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request, HttpServletResponse response) {
        return new AuthDtos.AuthResponse(authService.register(request, response));
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request, HttpServletResponse response) {
        return new AuthDtos.AuthResponse(authService.login(request, response));
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse response) {
        cookieUtil.clearToken(response);
    }

    @GetMapping("/me")
    public UserDto me(Authentication authentication) {
        return authService.me(authentication);
    }
}
