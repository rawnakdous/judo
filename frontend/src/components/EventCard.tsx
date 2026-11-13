import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";
import { EventImage } from "./EventImage";
import { DateTile } from "./DateTile";
import { formatDateRange } from "@/utils/dates";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link href={`/events/${event.id}`} className="group grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg focus-ring sm:grid-cols-[220px_1fr]">
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-auto sm:min-h-36">
        <EventImage src={event.imageUrl} alt={event.title} sizes="(min-width: 640px) 220px, 100vw" className="object-cover transition duration-300 group-hover:scale-105" />
        <DateTile value={event.startDatetime} className="absolute left-3 top-3" />
      </div>
      <div className="flex min-w-0 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-black leading-tight text-navy group-hover:text-redbrand">{event.title}</h3>
          <StatusBadge status={event.status} />
        </div>
        <div className="space-y-2 text-sm font-semibold text-slate-600">
          <p className="flex items-center gap-2"><CalendarDays size={16} aria-hidden />{formatDateRange(event.startDatetime, event.endDatetime)}</p>
          <p className="flex items-center gap-2"><MapPin size={16} aria-hidden />{event.location}</p>
        </div>
      </div>
    </Link>
  );
}
