package com.judoclub.constantine.service;

import com.judoclub.constantine.dto.AuthDtos;
import com.judoclub.constantine.dto.UserDto;
import com.judoclub.constantine.entity.Role;
import com.judoclub.constantine.entity.User;
import com.judoclub.constantine.exception.BadRequestException;
import com.judoclub.constantine.repository.UserRepository;
import com.judoclub.constantine.security.CookieUtil;
import com.judoclub.constantine.security.JwtService;
import com.judoclub.constantine.security.UserPrincipal;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CookieUtil cookieUtil;
    private final MapperService mapper;

    @Transactional
    public UserDto register(AuthDtos.RegisterRequest request, HttpServletResponse response) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("Cette adresse e-mail est déjà utilisée");
        }
        User user = User.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();
        User saved = userRepository.save(user);
        cookieUtil.writeToken(response, jwtService.createToken(new UserPrincipal(saved)));
        return mapper.user(saved);
    }

    public UserDto login(AuthDtos.LoginRequest request, HttpServletResponse response) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        cookieUtil.writeToken(response, jwtService.createToken(principal));
        return mapper.user(principal.getUser());
    }

    public UserDto me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            throw new BadCredentialsException("Non authentifié");
        }
        return mapper.user(principal.getUser());
    }
}
