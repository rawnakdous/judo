package com.judoclub.constantine.util;

public final class Strings {
    private Strings() {}

    /** Trims the value; returns {@code null} for null or blank input (optional fields are stored as NULL). */
    public static String blankToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
