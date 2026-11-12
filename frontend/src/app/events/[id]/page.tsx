"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, LayoutGrid, MapPin, Radio, SearchX } from "lucide-react";
import type { Event } from "@/types/domain";
import { PageShell } from "@/components/PageShell";
import { EventImage } from "@/components/EventImage";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ShareButton } from "@/components/ShareButton";
import { DateTile } from "@/components/DateTile";
import { ApiError } from "@/services/api/client";
import { eventService, tatamiService } from "@/services/api/services";
import { formatDateRange, formatStartsIn, formatTime } from "@/utils/dates";

type State =
  | { status: "loading" }
  | { status: "notFound" }
  | { status: "error"; message: string }
  | { status: "loaded"; event: Event; tatamiCount: number | null };

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<State>({ status: "loading" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    Promise.all([eventService.get(id), tatamiService.list(id).then((t) => t.length).catch(() => null)])
      .then(([event, tatamiCount]) => active && setState({ status: "loaded", event, tatamiCount }))
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiError && (error.status === 404 || error.status === 400)) setState({ status: "notFound" });
        else setState({ status: "error", message: error instanceof Error ? error.message : "Événement indisponible" });
      });
    return () => { active = false; };
  }, [id]);

  // keep the countdown fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const title = state.status === "loaded" ? state.event.title : null;
  useEffect(() => {
    if (title) document.title = `${title} · Judo Club Constantine`;
  }, [title]);

  if (state.status === "loading") return <PageShell><LoadingState /></PageShell>;
  if (state.status === "error") return <PageShell><ErrorState message={state.message} /></PageShell>;
  if (state.status === "notFound") return <PageShell><NotFound /></PageShell>;

  const { event, tatamiCount } = state;
  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-navy shadow focus-ring"><ArrowLeft size={18} /> Événements</Link>
        <ShareButton title={event.title} />
      </div>

      <header className="relative h-56 overflow-hidden rounded-xl bg-navy shadow-soft sm:h-72 lg:h-80">
        <EventImage src={event.imageUrl} alt="" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 sm:p-8">
          <DateTile value={event.startDatetime} className="hidden shrink-0 sm:grid" />
          <div className="min-w-0">
            <StatusBadge status={event.status} />
            <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-4xl">{event.title}</h1>
          </div>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <aside className="lg:order-2">
          <div className="rounded-xl bg-white p-5 shadow-soft lg:sticky lg:top-24">
            {event.status === "LIVE" ? (
              <>
                <p className="flex items-center gap-2 text-sm font-black text-redbrand"><span className="h-2 w-2 animate-pulse rounded-full bg-redbrand" aria-hidden /> Les combats sont en cours</p>
                <Link href={`/events/${event.id}/live`} className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-lg bg-redbrand px-5 text-base font-black text-white shadow-soft transition hover:bg-red-700 focus-ring">
                  <Radio size={20} aria-hidden /> REGARDER LE LIVE
                </Link>
              </>
            ) : event.status === "UPCOMING" ? (
              <p className="flex items-center justify-center gap-2 rounded-lg bg-soft px-4 py-4 text-center text-base font-black text-navy">
                <Clock size={20} aria-hidden /> {formatStartsIn(event.startDatetime, now)}
              </p>
            ) : (
              <p className="rounded-lg bg-soft px-4 py-4 text-center text-sm font-black text-slate-500">Événement terminé</p>
            )}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">Organisateur</p>
              <p className="mt-1 text-base font-black text-navy">{event.organizerName}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 lg:order-1">
          <dl className="grid gap-3 sm:grid-cols-3">
            <Fact icon={<CalendarDays size={18} />} label="Dates">
              {formatDateRange(event.startDatetime, event.endDatetime)}
              <span className="block text-xs font-semibold text-slate-500">{formatTime(event.startDatetime)} – {formatTime(event.endDatetime)}</span>
            </Fact>
            <Fact icon={<MapPin size={18} />} label="Lieu">{event.location}</Fact>
            {tatamiCount !== null && tatamiCount > 0 && (
              <Fact icon={<LayoutGrid size={18} />} label="Tapis">{tatamiCount} tapis</Fact>
            )}
          </dl>
          <section className="mt-6 rounded-xl bg-white p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-black text-navy">À propos de l&apos;événement</h2>
            <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-600 sm:text-base">{event.description}</p>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

function Fact({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-soft">
      <dt className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><span className="text-redbrand">{icon}</span>{label}</dt>
      <dd className="mt-2 text-sm font-black text-navy">{children}</dd>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
      <SearchX className="mx-auto text-redbrand" size={36} aria-hidden />
      <h1 className="mt-4 text-2xl font-black text-navy">Événement introuvable</h1>
      <p className="mt-2 text-sm font-semibold text-slate-500">Cet événement n&apos;existe pas ou a été supprimé.</p>
      <Link href="/events" className="mt-6 inline-flex items-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-black text-white focus-ring"><ArrowLeft size={18} /> Voir les événements</Link>
    </div>
  );
}
