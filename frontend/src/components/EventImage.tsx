"use client";

import Image from "next/image";
import { useState } from "react";

export const EVENT_FALLBACK_IMAGE = "/event-fallback.svg";

/** Hosts allowed in next.config.ts `images.remotePatterns` (served through the Next image optimizer). */
const OPTIMIZED_HOSTS = new Set(["images.unsplash.com", "img.youtube.com"]);

function isOptimizable(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && OPTIMIZED_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Event/athlete image from an admin-entered URL. Any host works: unknown hosts are loaded
 * directly by the browser (unoptimized) instead of crashing next/image, and a broken or
 * missing image falls back to the club placeholder. Renders with `fill`: the parent must be
 * positioned and sized.
 */
export function EventImage({ src, alt, sizes, priority, className = "object-cover" }: {
  src?: string | null;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const wanted = src?.trim() || null;
  const effective = wanted && wanted !== failedSrc ? wanted : EVENT_FALLBACK_IMAGE;
  const isFallback = effective === EVENT_FALLBACK_IMAGE;

  return (
    <Image
      key={effective}
      src={effective}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      unoptimized={isFallback || !isOptimizable(effective)}
      onError={isFallback ? undefined : () => setFailedSrc(effective)}
      data-fallback={isFallback ? "true" : undefined}
    />
  );
}
