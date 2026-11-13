package com.judoclub.constantine.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

@Component
public class CookieUtil {
    private final String cookieName;
    private final boolean secureCookie;
    private final Duration maxAge;

    public CookieUtil(@Value("${app.jwt.cookie-name}") String cookieName,
                      @Value("${app.jwt.secure-cookie}") boolean secureCookie,
                      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.cookieName = cookieName;
        this.secureCookie = secureCookie;
        this.maxAge = Duration.ofMinutes(expirationMinutes);
    }

    public Optional<String> readToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }
        return Arrays.stream(request.getCookies())
                .filter(cookie -> cookieName.equals(cookie.getName()))
                .map(Cookie::getValue)
                .findFirst();
    }

    public void writeToken(HttpServletResponse response, String token) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax") // same-origin deployment; also blocks cross-site POSTs (CSRF)
                .path("/")
                .maxAge(maxAge)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }

    public void clearToken(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(cookieName, "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite("Lax") // same-origin deployment; also blocks cross-site POSTs (CSRF)
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
    }
}
