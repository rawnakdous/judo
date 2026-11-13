package com.judoclub.constantine.dto;

public final class ValidationPatterns {
    private ValidationPatterns() {}

    /** Empty, or an absolute http(s) URL without whitespace. */
    public static final String HTTP_URL_OR_EMPTY = "^$|^https?://\\S+$";
}
