import { useEffect, useSyncExternalStore } from "react";
import type { User } from "@/types/domain";
import { ApiError } from "./api/client";
import { authService } from "./api/services";

/**
 * Who is using the site. Loaded once from GET /auth/me and shared by every component
 * (header, bottom nav, admin guard, profile). 401 means "anonymous" — the normal case for visitors.
 */
export type Session =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User };

const LOADING: Session = { status: "loading" };
const ANONYMOUS: Session = { status: "anonymous" };

let session: Session = LOADING;
let inflight: Promise<Session> | null = null;
const listeners = new Set<() => void>();

function publish(next: Session) {
  session = next;
  listeners.forEach((listener) => listener());
}

/** Fetches /auth/me (deduplicated). `force` re-checks even if already known. */
export function loadSession(force = false): Promise<Session> {
  if (!force && session.status !== "loading") return Promise.resolve(session);
  if (inflight) return inflight;
  inflight = authService.me()
    .then((user): Session => ({ status: "authenticated", user }))
    .catch((error): Session => {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.warn("Session check failed", error);
      }
      return ANONYMOUS;
    })
    .then((next) => {
      inflight = null;
      publish(next);
      return next;
    });
  return inflight;
}

/** Call after login/register (with the returned user) or logout (null). */
export function setSessionUser(user: User | null) {
  publish(user ? { status: "authenticated", user } : ANONYMOUS);
}

export async function logout() {
  try {
    await authService.logout();
  } finally {
    setSessionUser(null);
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCurrentUser(): Session {
  const current = useSyncExternalStore(subscribe, () => session, () => LOADING);
  useEffect(() => {
    void loadSession();
  }, []);
  return current;
}

/** Test helper. */
export function __resetSessionForTests() {
  session = LOADING;
  inflight = null;
}
