"use client";

import { useEffect, useRef, useState } from "react";
import type { EventLive } from "@/types/domain";
import { eventService } from "@/services/api/services";

export const LIVE_POLL_MS = 10_000;
/** Server age is trusted only up to this much, so a wrong device clock cannot fake staleness. */
const MAX_TRUSTED_SERVER_AGE_MS = 15_000;

export type LiveState = {
  data: EventLive | null;
  /** Device time (ms) the snapshot was produced, corrected for cache age; null before the first success. */
  snapshotAt: number | null;
  /** First load failed and nothing to show. */
  initialError: string | null;
  /** The latest refresh failed (previous data is still shown). */
  refreshFailed: boolean;
};

/**
 * Polls GET /events/{id}/live every 10 s while the tab is visible; refreshes immediately when the
 * tab becomes visible again. A failed refresh keeps the last snapshot.
 */
export function useLivePolling(eventId: string): LiveState {
  const [state, setState] = useState<LiveState>({ data: null, snapshotAt: null, initialError: null, refreshFailed: false });
  const hasData = useRef(false);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const load = () => {
      eventService.live(eventId)
        .then((data) => {
          if (!active) return;
          const receivedAt = Date.now();
          const serverAge = Math.min(Math.max(receivedAt - Date.parse(data.generatedAt), 0), MAX_TRUSTED_SERVER_AGE_MS);
          hasData.current = true;
          setState({ data, snapshotAt: receivedAt - (Number.isFinite(serverAge) ? serverAge : 0), initialError: null, refreshFailed: false });
        })
        .catch((error: unknown) => {
          if (!active) return;
          const message = error instanceof Error ? error.message : "Live indisponible";
          setState((s) => hasData.current ? { ...s, refreshFailed: true } : { ...s, initialError: message });
        });
    };

    const start = () => {
      if (timer) return;
      load();
      timer = setInterval(load, LIVE_POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === "hidden" ? stop() : start());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [eventId]);

  return state;
}
