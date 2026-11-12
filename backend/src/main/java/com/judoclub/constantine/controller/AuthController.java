package com.judoclub.constantine.controller;

import com.judoclub.constantine.dto.AuthDtos;
import com.judoclub.constantine.dto.UserDto;
import com.judoclub.constantine.security.CookieUtil;
import com.judoclub.constantine.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.AuthenticationException;
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
    private final LoginRateLimiter rateLimiter;

    @PostMapping("/register")
    public AuthDtos.AuthResponse register(@Valid @RequestBody AuthDtos.RegisterRequest request,
                                          HttpServletRequest httpRequest, HttpServletResponse response) {
        rateLimiter.acquireIp(httpRequest.getRemoteAddr());
        return new AuthDtos.AuthResponse(authService.register(request, response));
    }

    /** getRemoteAddr() is the real client IP in prod (server.forward-headers-strategy=framework behind Caddy). */
    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@Valid @RequestBody AuthDtos.LoginRequest request,
                                       HttpServletRequest httpRequest, HttpServletResponse response) {
        rateLimiter.acquireIp(httpRequest.getRemoteAddr());
        rateLimiter.checkEmail(request.email());
        try {
            AuthDtos.AuthResponse result = new AuthDtos.AuthResponse(authService.login(request, response));
            rateLimiter.recordSuccess(request.email());
            return result;
        } catch (AuthenticationException e) {
            rateLimiter.recordFailure(request.email());
            throw e;
        }
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
