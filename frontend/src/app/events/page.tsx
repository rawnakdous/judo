"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, List } from "lucide-react";
import clsx from "clsx";
import type { Event } from "@/types/domain";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EventSections } from "@/components/EventSections";
import { EventCalendar } from "@/components/EventCalendar";
import { eventService } from "@/services/api/services";
import { currentClubMonth, formatMonthKey, parseMonthKey, type MonthKey } from "@/utils/calendar";

export default function EventsPage() {
  return (
    <PageShell>
      <section className="relative mb-8 overflow-hidden rounded-xl bg-navy px-6 py-8 text-white shadow-soft sm:px-10 sm:py-12">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border-[18px] border-redbrand/70" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-redbrand" aria-hidden />
        <p className="relative text-xs font-black uppercase tracking-[0.2em] text-redbrand">Force · Discipline · Respect</p>
        <h1 className="relative mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">Les événements du Judo Club Constantine</h1>
        <p className="relative mt-3 max-w-xl text-sm font-semibold text-white/75 sm:text-base">
          Compétitions, stages et championnats : suivez le programme et regardez les combats en direct, tapis par tapis.
        </p>
      </section>
      <Suspense fallback={<LoadingState />}>
        <EventsView />
      </Suspense>
    </PageShell>
  );
}

/** ?view=calendar&month=YYYY-MM are kept in the URL so a view can be shared or bookmarked. */
function EventsView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const view = params.get("view") === "calendar" ? "calendar" : "list";
  const month = parseMonthKey(params.get("month"), currentClubMonth());

  function navigate(next: { view?: "list" | "calendar"; month?: MonthKey }) {
    const query = new URLSearchParams(params.toString());
    const nextView = next.view ?? view;
    if (nextView === "calendar") {
      query.set("view", "calendar");
      if (next.month) query.set("month", formatMonthKey(next.month));
    } else {
      query.delete("view");
      query.delete("month");
    }
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <>
      <div className="mb-6 inline-grid grid-cols-2 rounded-lg bg-white p-1 shadow-soft" role="group" aria-label="Affichage">
        <ViewButton active={view === "list"} onClick={() => navigate({ view: "list" })} icon={<List size={16} />}>Liste</ViewButton>
        <ViewButton active={view === "calendar"} onClick={() => navigate({ view: "calendar" })} icon={<CalendarDays size={16} />}>Calendrier</ViewButton>
      </div>
      {view === "calendar"
        ? <EventCalendar month={month} onMonthChange={(m) => navigate({ month: m })} />
        : <EventList />}
    </>
  );
}

function EventList() {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    eventService.list()
      .then((list) => active && setEvents(list))
      .catch((err: Error) => active && setError(err.message));
    return () => { active = false; };
  }, []);

  if (error) return <ErrorState message={error} />;
  if (!events) return <LoadingState />;
  return <EventSections events={events} />;
}

function ViewButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={clsx("inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-black focus-ring", active ? "bg-navy text-white" : "text-slate-600 hover:bg-slate-100")}>
      {icon} {children}
    </button>
  );
}
