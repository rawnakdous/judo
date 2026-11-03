import Image from "next/image";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";

const fallback = "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=900&q=80";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg focus-ring sm:grid-cols-[220px_1fr]">
      <div className="relative aspect-[16/10] sm:aspect-auto">
        <Image src={event.imageUrl || fallback} alt={event.title} fill className="object-cover" sizes="(min-width: 640px) 220px, 100vw" />
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-black leading-tight text-navy">{event.title}</h2>
          <StatusBadge status={event.status} />
        </div>
        <div className="space-y-2 text-sm font-semibold text-slate-600">
          <p className="flex items-center gap-2"><CalendarDays size={16} />{formatDateRange(event.startDatetime, event.endDatetime)}</p>
          <p className="flex items-center gap-2"><MapPin size={16} />{event.location}</p>
        </div>
      </div>
    </Link>
  );
}

export function formatDateRange(start: string, end: string) {
  const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
  return `${new Intl.DateTimeFormat("fr-DZ", options).format(new Date(start))} - ${new Intl.DateTimeFormat("fr-DZ", options).format(new Date(end))}`;
}
