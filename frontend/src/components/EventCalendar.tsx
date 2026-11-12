"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { Event, EventStatus } from "@/types/domain";
import { eventService } from "@/services/api/services";
import { ErrorState } from "./ErrorState";
import { StatusBadge } from "./StatusBadge";
import { formatDateRange, toClubDayKey } from "@/utils/dates";
import { WEEKDAYS, addMonths, dayLabel, eventsByDay, gridRange, monthGrid, monthLabel, type MonthKey } from "@/utils/calendar";

const chipColors: Record<EventStatus, string> = {
  LIVE: "bg-redbrand text-white",
  UPCOMING: "bg-navy text-white",
  FINISHED: "bg-slate-200 text-slate-700"
};

type Loaded = { range: string; events: Event[]; error?: string };

/** Month grid of events. Desktop: event chips in cells. Mobile: dots, plus the selected day's list. */
export function EventCalendar({ month, onMonthChange }: { month: MonthKey; onMonthChange: (month: MonthKey) => void }) {
  const range = useMemo(() => gridRange(month), [month]);
  const rangeKey = `${range.from}/${range.to}`;
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const today = toClubDayKey(new Date());

  useEffect(() => {
    let active = true;
    eventService.list({ from: range.from, to: range.to })
      .then((events) => active && setLoaded({ range: rangeKey, events }))
      .catch((err: Error) => active && setLoaded({ range: rangeKey, events: [], error: err.message }));
    return () => { active = false; };
  }, [range.from, range.to, rangeKey]);

  const loading = loaded?.range !== rangeKey;
  const byDay = useMemo(() => eventsByDay(loading ? [] : loaded?.events ?? [], range), [loaded, loading, range]);
  const weeks = monthGrid(month);
  const inThisMonth = (key: string) => key.startsWith(`${month.year}-${String(month.month).padStart(2, "0")}`);
  const selectedKey = selected && inThisMonth(selected) ? selected : inThisMonth(today) ? today : null;
  const selectedEvents = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  return (
    <section className="rounded-lg bg-white p-3 shadow-soft sm:p-5" aria-label="Calendrier des événements">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => onMonthChange(addMonths(month, -1))} className="rounded-full p-2 text-navy hover:bg-slate-100 focus-ring" aria-label="Mois précédent">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-black capitalize text-navy" aria-live="polite">{monthLabel(month)}</h2>
        <button type="button" onClick={() => onMonthChange(addMonths(month, 1))} className="rounded-full p-2 text-navy hover:bg-slate-100 focus-ring" aria-label="Mois suivant">
          <ChevronRight size={20} />
        </button>
      </div>

      {loaded?.error && !loading && <div className="mb-4"><ErrorState message={loaded.error} /></div>}

      <div role="grid" aria-busy={loading} className={clsx("grid grid-cols-7 gap-px overflow-hidden rounded-md bg-slate-200", loading && "opacity-60")}>
        {WEEKDAYS.map((day) => (
          <div key={day} role="columnheader" className="bg-slate-50 py-2 text-center text-xs font-black uppercase text-slate-500">{day}</div>
        ))}
        {weeks.flat().map((day) => {
          const events = byDay.get(day.key) ?? [];
          const isSelected = day.key === selectedKey;
          return (
            <div key={day.key} role="gridcell" aria-selected={isSelected}
              className={clsx("min-h-14 bg-white p-1 sm:min-h-28 sm:p-1.5", !day.inMonth && "bg-slate-50 text-slate-400")}>
              <button type="button" onClick={() => setSelected(day.key)}
                aria-label={`${day.day}${events.length ? `, ${events.length} événement${events.length > 1 ? "s" : ""}` : ""}`}
                className={clsx("grid h-7 w-7 place-items-center rounded-full text-xs font-black focus-ring",
                  day.key === today ? "bg-redbrand text-white" : isSelected ? "bg-navy text-white" : day.inMonth ? "text-navy" : "")}>
                {day.day}
              </button>
              {/* mobile: dots */}
              <div className="mt-1 flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
                {events.slice(0, 3).map((e) => <span key={e.id} className={clsx("h-1.5 w-1.5 rounded-full", e.status === "LIVE" ? "bg-redbrand" : e.status === "FINISHED" ? "bg-slate-400" : "bg-navy")} />)}
              </div>
              {/* desktop: chips */}
              <ul className="mt-1 hidden space-y-1 sm:block">
                {events.slice(0, 3).map((e) => (
                  <li key={e.id}>
                    <Link href={`/events/${e.id}`} title={e.title} className={clsx("block truncate rounded px-1.5 py-0.5 text-[11px] font-bold focus-ring", chipColors[e.status])}>{e.title}</Link>
                  </li>
                ))}
                {events.length > 3 && (
                  <li><button type="button" onClick={() => setSelected(day.key)} className="text-[11px] font-bold text-slate-500 hover:text-navy">+{events.length - 3} autres</button></li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {selectedKey && (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-black first-letter:uppercase text-navy">
            {dayLabel(selectedKey)}
          </h3>
          {selectedEvents.length === 0 ? (
            <p className="text-sm font-semibold text-slate-500">Aucun événement ce jour-là.</p>
          ) : (
            <ul className="space-y-2">
              {selectedEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 px-3 py-3 focus-ring">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-navy">{e.title}</span>
                      <span className="block text-xs font-semibold text-slate-500">{formatDateRange(e.startDatetime, e.endDatetime)} · {e.location}</span>
                    </span>
                    <StatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
