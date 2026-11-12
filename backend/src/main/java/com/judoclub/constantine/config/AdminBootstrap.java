package com.judoclub.constantine.config;

import com.judoclub.constantine.entity.Role;
import com.judoclub.constantine.entity.User;
import com.judoclub.constantine.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the first administrator in every profile, but only when no ADMIN exists yet and
 * both ADMIN_EMAIL and ADMIN_PASSWORD are set. Once an admin exists, the variables can be removed.
 */
@Component
@Order(1)
public class AdminBootstrap implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder,
                          @Value("${app.bootstrap-admin.email:}") String email,
                          @Value("${app.bootstrap-admin.password:}") String password) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureAdmin(email, password);
    }

    /** @return true if an admin was created */
    @Transactional
    public boolean ensureAdmin(String email, String password) {
        if (users.existsByRole(Role.ADMIN)) {
            return false;
        }
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            log.warn("No administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one at startup.");
            return false;
        }
        if (password.length() < 8) {
            throw new IllegalStateException("ADMIN_PASSWORD must contain at least 8 characters");
        }
        if (users.existsByEmailIgnoreCase(email)) {
            throw new IllegalStateException("ADMIN_EMAIL belongs to an existing non-admin user: " + email);
        }
        users.save(User.builder()
                .firstName("Admin")
                .lastName("Judo Club")
                .email(email.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .build());
        log.info("Created initial administrator {}", email);
        return true;
    }
}
