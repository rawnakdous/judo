package com.judoclub.constantine.util;

import com.judoclub.constantine.exception.BadRequestException;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class YouTubeUrlUtil {
    private static final Pattern VIDEO_ID = Pattern.compile("^[A-Za-z0-9_-]{6,}$");

    private YouTubeUrlUtil() {}

    public static String normalize(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String id = extractVideoId(input.trim());
        if (id == null) {
            throw new BadRequestException("Le lien YouTube Live est invalide");
        }
        return "https://www.youtube.com/live/" + id;
    }

    public static String extractVideoId(String input) {
        try {
            URI uri = URI.create(input);
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            String path = uri.getPath() == null ? "" : uri.getPath();

            if (host.equals("youtu.be")) {
                return clean(path.replaceFirst("^/", ""));
            }
            if (host.endsWith("youtube.com")) {
                if (path.equals("/watch")) {
                    for (String part : uri.getQuery() == null ? new String[0] : uri.getQuery().split("&")) {
                        String[] kv = part.split("=", 2);
                        if (kv.length == 2 && kv[0].equals("v")) {
                            return clean(kv[1]);
                        }
                    }
                }
                if (path.startsWith("/live/")) {
                    return clean(path.substring("/live/".length()));
                }
            }
        } catch (IllegalArgumentException ignored) {
            return null;
        }
        return null;
    }

    private static String clean(String value) {
        if (value == null) {
            return null;
        }
        String id = value.split("[?&#/]")[0];
        Matcher matcher = VIDEO_ID.matcher(id);
        return matcher.matches() ? id : null;
    }
}
