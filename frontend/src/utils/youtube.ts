const VIDEO_ID = /^[A-Za-z0-9_-]{6,}$/;

export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      return clean(parsed.pathname.slice(1));
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") return clean(parsed.searchParams.get("v"));
      if (parsed.pathname.startsWith("/live/")) return clean(parsed.pathname.replace("/live/", ""));
    }
  } catch {
    return null;
  }
  return null;
}

export function toYouTubeEmbedUrl(url?: string | null): string | null {
  const id = extractYouTubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}?autoplay=0&rel=0` : null;
}

function clean(value?: string | null) {
  if (!value) return null;
  const id = value.split(/[?&#/]/)[0];
  return VIDEO_ID.test(id) ? id : null;
}
