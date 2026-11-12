package com.judoclub.constantine.exception;

import com.judoclub.constantine.dto.ApiError;
import com.judoclub.constantine.dto.ImportDtos;
import com.judoclub.constantine.dto.LiveDtos;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 400 ---------------------------------------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException ex) {
        List<ApiError.FieldError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(field -> new ApiError.FieldError(field.getField(), field.getDefaultMessage()))
                .toList();
        String message = errors.isEmpty() ? "Requête invalide" : errors.get(0).message();
        return ResponseEntity.badRequest()
                .body(new ApiError(HttpStatus.BAD_REQUEST.value(), message, Instant.now(), errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiError> constraintViolation(ConstraintViolationException ex) {
        List<ApiError.FieldError> errors = ex.getConstraintViolations().stream()
                .map(v -> new ApiError.FieldError(v.getPropertyPath().toString(), v.getMessage()))
                .toList();
        String message = errors.isEmpty() ? "Requête invalide" : errors.get(0).message();
        return ResponseEntity.badRequest()
                .body(new ApiError(HttpStatus.BAD_REQUEST.value(), message, Instant.now(), errors));
    }

    @ExceptionHandler(ImportValidationException.class)
    ResponseEntity<ImportDtos.ImportError> importValidation(ImportValidationException ex) {
        return ResponseEntity.badRequest().body(new ImportDtos.ImportError(
                HttpStatus.BAD_REQUEST.value(), ex.getMessage(), Instant.now(), ex.getErrors()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiError> uploadTooLarge(MaxUploadSizeExceededException ex) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "Fichier trop volumineux (maximum 1 Mo)");
    }

    @ExceptionHandler(BadRequestException.class)
    ResponseEntity<ApiError> badRequest(BadRequestException ex) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> unreadable(HttpMessageNotReadableException ex) {
        return error(HttpStatus.BAD_REQUEST, "Corps de la requête invalide ou mal formé");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> typeMismatch(MethodArgumentTypeMismatchException ex) {
        return error(HttpStatus.BAD_REQUEST, "Valeur invalide pour le paramètre « " + ex.getName() + " »");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiError> missingParameter(MissingServletRequestParameterException ex) {
        return error(HttpStatus.BAD_REQUEST, "Paramètre obligatoire manquant : " + ex.getParameterName());
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    ResponseEntity<ApiError> missingPart(MissingServletRequestPartException ex) {
        return error(HttpStatus.BAD_REQUEST, "Fichier obligatoire manquant : " + ex.getRequestPartName());
    }

    // 401 / 403 ---------------------------------------------------------------------------------

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<ApiError> unauthorized(AuthenticationException ex) {
        return error(HttpStatus.UNAUTHORIZED, "Identifiants invalides");
    }

    @ExceptionHandler(ForbiddenException.class)
    ResponseEntity<ApiError> forbiddenAction(ForbiddenException ex) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiError> forbidden(AccessDeniedException ex) {
        return error(HttpStatus.FORBIDDEN, "Accès refusé");
    }

    // 404 / 405 / 409 / 415 ---------------------------------------------------------------------

    @ExceptionHandler(ResourceNotFoundException.class)
    ResponseEntity<ApiError> notFound(ResourceNotFoundException ex) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(NoResourceFoundException.class)
    ResponseEntity<ApiError> noRoute(NoResourceFoundException ex) {
        return error(HttpStatus.NOT_FOUND, "Ressource introuvable");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> methodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return error(HttpStatus.METHOD_NOT_ALLOWED, "Méthode HTTP non autorisée : " + ex.getMethod());
    }

    @ExceptionHandler(StaleTatamiStateException.class)
    ResponseEntity<LiveDtos.StaleTatamiError> staleTatami(StaleTatamiStateException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new LiveDtos.StaleTatamiError(
                HttpStatus.CONFLICT.value(), ex.getMessage(), Instant.now(), ex.getCurrent()));
    }

    @ExceptionHandler(ConflictException.class)
    ResponseEntity<ApiError> conflict(ConflictException ex) {
        return error(HttpStatus.CONFLICT, ex.getMessage());
    }

    /** Known DB constraint names → French messages. Unknown constraints get a generic message. */
    private static final Map<String, String> CONSTRAINT_MESSAGES = Map.of(
            "uk_combat_event_number", "Ce numéro de combat existe déjà pour cet événement",
            "uk_one_in_progress_per_tatami", "Un combat est déjà en cours sur ce tapis",
            "uk_tatami_event_number", "Ce numéro de tapis existe déjà pour cet événement",
            "combats_athlete_1_id_fkey", "Impossible de supprimer : cet athlète a des combats",
            "combats_athlete_2_id_fkey", "Impossible de supprimer : cet athlète a des combats",
            "users_email_key", "Cette adresse e-mail est déjà utilisée",
            "idx_users_email", "Cette adresse e-mail est déjà utilisée"
    );

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiError> dataIntegrity(DataIntegrityViolationException ex) {
        String constraint = constraintName(ex);
        log.warn("Data integrity violation (constraint={}): {}", constraint, ex.getMostSpecificCause().getMessage());
        String message = constraint == null ? null : CONSTRAINT_MESSAGES.get(constraint.toLowerCase());
        return error(HttpStatus.CONFLICT, message != null ? message : "Conflit : cette donnée est déjà utilisée ou référencée");
    }

    private static String constraintName(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            if (t instanceof org.hibernate.exception.ConstraintViolationException cve && cve.getConstraintName() != null) {
                return cve.getConstraintName();
            }
        }
        return null;
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<ApiError> unsupportedMediaType(HttpMediaTypeNotSupportedException ex) {
        return error(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Type de contenu non pris en charge");
    }

    @ExceptionHandler(TooManyRequestsException.class)
    ResponseEntity<ApiError> tooManyRequests(TooManyRequestsException ex) {
        long seconds = Math.max(1, (long) Math.ceil(ex.getRetryAfter().toMillis() / 1000.0));
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(seconds))
                .body(new ApiError(HttpStatus.TOO_MANY_REQUESTS.value(), ex.getMessage()));
    }

    // 500 ---------------------------------------------------------------------------------------

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> server(Exception ex) {
        log.error("Unhandled exception", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur");
    }

    private ResponseEntity<ApiError> error(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(new ApiError(status.value(), message));
    }
}
