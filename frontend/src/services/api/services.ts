import { apiFetch } from "./client";
import type { Athlete, Combat, Event, EventLive, Tatami, User } from "@/types/domain";

export const authService = {
  register: (payload: unknown) => apiFetch<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload: unknown) => apiFetch<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => apiFetch<void>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me")
};

export const eventService = {
  list: () => apiFetch<Event[]>("/events"),
  get: (id: string | number) => apiFetch<Event>(`/events/${id}`),
  create: (payload: unknown) => apiFetch<Event>("/events", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string | number, payload: unknown) => apiFetch<Event>(`/events/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  delete: (id: string | number) => apiFetch<void>(`/events/${id}`, { method: "DELETE" }),
  live: (id: string | number) => apiFetch<EventLive>(`/events/${id}/live`)
};

export const tatamiService = {
  list: (eventId: string | number) => apiFetch<Tatami[]>(`/events/${eventId}/tatamis`),
  updateLive: (eventId: string | number, tatamiId: string | number, payload: unknown) =>
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
  start: (id: string | number) => apiFetch<Combat>(`/combats/${id}/start`, { method: "POST" }),
  finish: (id: string | number) => apiFetch<Combat>(`/combats/${id}/finish`, { method: "POST" })
};

export const adminService = {
  users: () => apiFetch<User[]>("/admin/users")
};
