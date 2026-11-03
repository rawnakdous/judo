"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, MapPin, Share2 } from "lucide-react";
import type { Event } from "@/types/domain";
import { PageShell } from "@/components/PageShell";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { formatDateRange } from "@/components/EventCard";
import { eventService } from "@/services/api/services";

const fallback = "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1400&q=80";

export default function EventDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    eventService.get(id).then(setEvent).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <PageShell><ErrorState message={error} /></PageShell>;
  if (!event) return <PageShell><LoadingState /></PageShell>;

  return (
    <PageShell>
      <div className="mb-4 flex items-center justify-between">
        <Link href="/events" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-navy shadow focus-ring"><ArrowLeft size={18} /> Retour</Link>
        <button className="rounded-full bg-white p-2 text-navy shadow focus-ring" aria-label="Partager"><Share2 size={18} /></button>
      </div>
      <article className="overflow-hidden rounded-lg bg-white shadow-soft">
        <div className="relative aspect-[16/9] max-h-[520px]">
          <Image src={event.imageUrl || fallback} alt={event.title} fill className="object-cover" sizes="100vw" priority />
        </div>
        <div className="grid gap-8 p-5 lg:grid-cols-[1fr_320px] lg:p-8">
          <div>
            <div className="mb-3"><StatusBadge status={event.status} /></div>
            <h1 className="text-3xl font-black leading-tight text-navy">{event.title}</h1>
            <section className="mt-6 space-y-4">
              <h2 className="text-base font-black text-navy">Petit Schedule</h2>
              <p className="flex items-center gap-2 text-sm font-bold text-slate-600"><CalendarDays size={18} />{formatDateRange(event.startDatetime, event.endDatetime)}</p>
              <h2 className="text-base font-black text-navy">Lieu du lieu</h2>
              <p className="flex items-center gap-2 text-sm font-bold text-slate-600"><MapPin size={18} />{event.location}</p>
              <h2 className="text-base font-black text-navy">Description</h2>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">{event.description}</p>
            </section>
          </div>
          <aside className="rounded-lg bg-soft p-5">
            <p className="text-sm font-bold text-slate-500">Organisateur</p>
            <p className="mt-1 text-lg font-black text-navy">{event.organizerName}</p>
            {event.status === "LIVE" ? (
              <Link href={`/events/${event.id}/live`} className="mt-6 block rounded-md bg-redbrand px-5 py-3 text-center text-sm font-black text-white shadow-soft focus-ring">REGARDER LE LIVE</Link>
            ) : (
              <p className="mt-6 rounded-md bg-white px-4 py-3 text-center text-sm font-black text-navy">{event.status === "UPCOMING" ? "Événement à venir" : "Événement terminé"}</p>
            )}
          </aside>
        </div>
      </article>
    </PageShell>
  );
}
