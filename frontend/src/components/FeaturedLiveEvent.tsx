import Link from "next/link";
import { CalendarDays, MapPin, Radio } from "lucide-react";
import type { Event } from "@/types/domain";
import { EventImage } from "./EventImage";
import { formatDateRange } from "@/utils/dates";

/** Large card for an event that is live right now: the main thing a visitor came for. */
export function FeaturedLiveEvent({ event }: { event: Event }) {
  return (
    <article className="grid overflow-hidden rounded-xl bg-navy text-white shadow-soft ring-2 ring-redbrand lg:grid-cols-[1.2fr_1fr]">
      <Link href={`/events/${event.id}`} className="relative block aspect-[16/9] focus-ring lg:aspect-auto lg:min-h-72" aria-label={`Détails de ${event.title}`}>
        <EventImage src={event.imageUrl} alt="" sizes="(min-width: 1024px) 60vw, 100vw" priority />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-redbrand px-3 py-1 text-xs font-black">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden /> EN DIRECT
        </span>
      </Link>
      <div className="flex flex-col justify-center gap-4 p-6 lg:p-8">
        <h3 className="text-2xl font-black leading-tight lg:text-3xl">
          <Link href={`/events/${event.id}`} className="hover:underline focus-ring">{event.title}</Link>
        </h3>
        <div className="space-y-2 text-sm font-semibold text-white/80">
          <p className="flex items-center gap-2"><CalendarDays size={16} aria-hidden />{formatDateRange(event.startDatetime, event.endDatetime)}</p>
          <p className="flex items-center gap-2"><MapPin size={16} aria-hidden />{event.location}</p>
        </div>
        <Link href={`/events/${event.id}/live`} className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-redbrand px-6 text-base font-black shadow-lg transition hover:bg-red-700 focus-ring sm:self-start">
          <Radio size={20} aria-hidden /> Regarder le live
        </Link>
      </div>
    </article>
  );
}
