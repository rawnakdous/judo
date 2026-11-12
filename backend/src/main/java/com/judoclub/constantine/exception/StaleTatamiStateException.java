package com.judoclub.constantine.exception;

import com.judoclub.constantine.dto.LiveDtos;
import lombok.Getter;

/**
 * The client's view of a tatami is out of date (double tap, retry after a lost response,
 * another admin acted first). Carries the current state so the client can refresh (HTTP 409).
 */
@Getter
public class StaleTatamiStateException extends RuntimeException {
    private final transient LiveDtos.TatamiLiveResponse current;

    public StaleTatamiStateException(LiveDtos.TatamiLiveResponse current) {
        super("Le tapis a déjà été mis à jour");
        this.current = current;
    }
}
