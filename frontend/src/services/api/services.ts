import { apiFetch } from "./client";
import type { Athlete, Combat, CombatImportResult, Event, EventLive, EventStatus, Tatami, TatamiLive, User } from "@/types/domain";

export type EventListParams = { status?: EventStatus; from?: string; to?: string };

function toQuery(params?: Record<string, string | undefined>) {
  const entries = Object.entries(params ?? {}).filter((entry): entry is [string, string] => Boolean(entry[1]));
  return entries.length ? `?${new URLSearchParams(entries).toString()}` : "";
}

export const authService = {
  register: (payload: unknown) => apiFetch<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: unknown) => apiFetch<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me")
};

export const eventService = {
  /** Sorted by start date. `from`/`to` are "YYYY-MM-DD" days (Africa/Algiers), inclusive, overlap match. */
  list: (params?: EventListParams) => apiFetch<Event[]>(`/events${toQuery(params)}`),
  get: (id: string | number) => apiFetch<Event>(`/events/${id}`),
  create: (payload: unknown) => apiFetch<Event>("/events", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string | number, payload: unknown) => apiFetch<Event>(`/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id: string | number) => apiFetch<void>(`/events/${id}`, { method: "DELETE" }),
  /** Public responses are cacheable for 5 s; admin screens pass fresh=true to bypass the browser cache. */
  live: (id: string | number, options?: { fresh?: boolean }) =>
    apiFetch<EventLive>(`/events/${id}/live`, options?.fresh ? { cache: "no-store" } : undefined)
};

export const tatamiService = {
  list: (eventId: string | number) => apiFetch<Tatami[]>(`/events/${eventId}/tatamis`),
  /** "Combat suivant". Throws ApiError 409 with body StaleTatamiError if the mat changed meanwhile. */
  next: (eventId: string | number, tatamiId: string | number, expectedCurrentCombatId: number | null) =>
    apiFetch<TatamiLive>(`/events/${eventId}/tatamis/${tatamiId}/next`, { method: "POST", body: JSON.stringify({ expectedCurrentCombatId }) }),
  updateLive: (eventId: string | number, tatamiId: string | number, payload: { liveUrl: string; active: boolean }) =>
    apiFetch<Tatami>(`/events/${eventId}/tatamis/${tatamiId}/live`, { method: "PUT", body: JSON.stringify(payload) })
};

export const athleteService = {
  list: (q = "") => apiFetch<Athlete[]>(`/athletes${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  create: (payload: unknown) => apiFetch<Athlete>("/athletes", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string | number, payload: unknown) => apiFetch<Athlete>(`/athletes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id: string | number) => apiFetch<void>(`/athletes/${id}`, { method: "DELETE" })
};

export const combatService = {
  list: (eventId: string | number) => apiFetch<Combat[]>(`/events/${eventId}/combats`),
  create: (payload: unknown) => apiFetch<Combat>("/combats", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string | number, payload: unknown) => apiFetch<Combat>(`/combats/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id: string | number) => apiFetch<void>(`/combats/${id}`, { method: "DELETE" }),
  /** CSV schedule upload (all rows valid or nothing imported). Throws ApiError 400 with body CombatImportError. */
  importCsv: (eventId: string | number, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiFetch<CombatImportResult>(`/events/${eventId}/combats/import`, { method: "POST", body });
  },
  start: (id: string | number) => apiFetch<Combat>(`/combats/${id}/start`, { method: "POST" }),
  finish: (id: string | number) => apiFetch<Combat>(`/combats/${id}/finish`, { method: "POST" }),
  reset: (id: string | number) => apiFetch<Combat>(`/combats/${id}/reset`, { method: "POST" })
};

export const adminService = {
  users: () => apiFetch<User[]>("/admin/users")
};
