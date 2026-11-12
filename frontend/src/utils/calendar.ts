import type { Event } from "@/types/domain";
import { toClubDayKey } from "./dates";

/**
 * Month-grid maths for the events calendar. Days are "YYYY-MM-DD" keys in club time
 * (Africa/Algiers); arithmetic on keys uses UTC so the device time zone never matters.
 */
export type MonthKey = { year: number; month: number }; // month: 1-12
export type CalendarDay = { key: string; day: number; inMonth: boolean };

export const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dateOf = (key: string) => new Date(`${key}T00:00:00Z`);

export function addDays(key: string, days: number): string {
  const d = dateOf(key);
  d.setUTCDate(d.getUTCDate() + days);
  return keyOf(d);
}

export function currentClubMonth(now: Date = new Date()): MonthKey {
  const [year, month] = toClubDayKey(now).split("-").map(Number);
  return { year, month };
}

/** "2026-12" -> {2026, 12}; invalid or missing -> fallback. */
export function parseMonthKey(value: string | null | undefined, fallback: MonthKey): MonthKey {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return fallback;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : fallback;
}

export function formatMonthKey({ year, month }: MonthKey): string {
  return `${year}-${pad(month)}`;
}

export function addMonths({ year, month }: MonthKey, delta: number): MonthKey {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

const monthLabelFormat = new Intl.DateTimeFormat("fr-DZ", { timeZone: "UTC", month: "long", year: "numeric" });

/** "décembre 2026" */
export function monthLabel({ year, month }: MonthKey): string {
  return monthLabelFormat.format(new Date(Date.UTC(year, month - 1, 1)));
}

const dayLabelFormat = new Intl.DateTimeFormat("fr-DZ", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });

/** "2026-12-02" -> "mercredi 2 décembre" */
export function dayLabel(key: string): string {
  return dayLabelFormat.format(dateOf(key));
}

/** Weeks (Monday first) covering the whole month, including leading/trailing days of adjacent months. */
export function monthGrid({ year, month }: MonthKey): CalendarDay[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7; // Monday = 0
  const weeks = Math.ceil((leading + daysInMonth) / 7);
  const start = addDays(keyOf(first), -leading);

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = addDays(start, w * 7 + d);
      const date = dateOf(key);
      return { key, day: date.getUTCDate(), inMonth: date.getUTCMonth() === month - 1 };
    })
  );
}

/** First and last visible day keys of the grid (for GET /events?from=&to=). */
export function gridRange(month: MonthKey): { from: string; to: string } {
  const weeks = monthGrid(month);
  return { from: weeks[0][0].key, to: weeks[weeks.length - 1][6].key };
}

/**
 * Events per club day; a multi-day event appears on every day it covers. Order of `events` is kept.
 * Pass the visible `range` so long events (e.g. a whole season) only fill the days on screen.
 */
export function eventsByDay(events: Event[], range?: { from: string; to: string }): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const event of events) {
    const startKey = toClubDayKey(event.startDatetime);
    const endKey = toClubDayKey(event.endDatetime);
    const first = range && range.from > startKey ? range.from : startKey;
    const last = range && range.to < endKey ? range.to : endKey;
    let key = first;
    for (let guard = 0; key <= last && guard < 400; guard++, key = addDays(key, 1)) {
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
  }
  return map;
}
