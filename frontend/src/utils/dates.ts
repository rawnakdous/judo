/**
 * All dates are displayed in the club's time zone, whatever the viewer's device zone is.
 * Algeria is UTC+1 all year (no daylight saving since 1981), so admin form inputs use a fixed +01:00.
 */
export const CLUB_TIME_ZONE = "Africa/Algiers";
const CLUB_OFFSET = "+01:00";
const LOCALE = "fr-DZ";

const base = { timeZone: CLUB_TIME_ZONE } as const;
const time = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } as const;

const dateFormat = new Intl.DateTimeFormat(LOCALE, { ...base, day: "2-digit", month: "short", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { ...base, day: "2-digit", month: "2-digit", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { ...base, ...time });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { ...base, day: "2-digit", month: "2-digit", year: "numeric", ...time });
const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { ...base, year: "numeric", month: "2-digit", day: "2-digit" });
const inputFormat = new Intl.DateTimeFormat("en-CA", { ...base, year: "numeric", month: "2-digit", day: "2-digit", ...time });

type DateInput = string | number | Date;
const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

/** "02 déc. 2026" */
export function formatDate(value: DateInput): string {
  return dateFormat.format(toDate(value));
}

/** "02/12/2026" */
export function formatShortDate(value: DateInput): string {
  return shortDateFormat.format(toDate(value));
}

/** "00:30" */
export function formatTime(value: DateInput): string {
  return timeFormat.format(toDate(value));
}

/** "02/12/2026 00:30" */
export function formatDateTime(value: DateInput): string {
  return dateTimeFormat.format(toDate(value)).replace(",", "");
}

/** "02 déc. 2026" if both are the same club-day, else "28 nov. 2026 - 02 déc. 2026". */
export function formatDateRange(start: DateInput, end: DateInput): string {
  const from = formatDate(start);
  const to = formatDate(end);
  return from === to ? from : `${from} - ${to}`;
}

/** Club-local calendar day "YYYY-MM-DD" (useful for grouping and calendar cells). */
export function toClubDayKey(value: DateInput): string {
  return dayKeyFormat.format(toDate(value));
}

/** ISO instant -> value for <input type="datetime-local"> in club time ("2026-12-02T00:30"). */
export function toClubInputValue(value?: string | null): string {
  if (!value) return "";
  const parts = Object.fromEntries(inputFormat.formatToParts(new Date(value)).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** <input type="datetime-local"> value typed in club time -> ISO-8601 with offset ("2026-12-02T00:30:00+01:00"). */
export function fromClubInputValue(value: string): string {
  return `${value.length === 16 ? `${value}:00` : value}${CLUB_OFFSET}`;
}

const relative = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
const DAY_MS = 86_400_000;

/**
 * Countdown label for an upcoming start, counted in club calendar days:
 * "Commence dans 12 minutes" / "dans 5 heures" (same day), "demain", "dans 3 jours".
 */
export function formatStartsIn(start: DateInput, now: DateInput = new Date()): string {
  const startDate = toDate(start);
  const nowDate = toDate(now);
  const diffMs = startDate.getTime() - nowDate.getTime();
  if (diffMs <= 0) return "Commence maintenant";
  const days = Math.round((Date.parse(`${toClubDayKey(startDate)}T00:00:00Z`) - Date.parse(`${toClubDayKey(nowDate)}T00:00:00Z`)) / DAY_MS);
  if (days >= 1) return `Commence ${relative.format(days, "day")}`;
  const minutes = Math.max(1, Math.round(diffMs / 60_000));
  return minutes < 60
    ? `Commence ${relative.format(minutes, "minute")}`
    : `Commence ${relative.format(Math.round(minutes / 60), "hour")}`;
}

const dayFormat = new Intl.DateTimeFormat(LOCALE, { ...base, day: "2-digit" });
const monthShortFormat = new Intl.DateTimeFormat(LOCALE, { ...base, month: "short" });

/** Calendar-tile parts in club time: { day: "20", month: "déc." }. */
export function formatDayMonth(value: DateInput): { day: string; month: string } {
  const date = toDate(value);
  return { day: dayFormat.format(date), month: monthShortFormat.format(date) };
}
