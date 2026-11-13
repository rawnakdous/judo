import type { Event } from "@/types/domain";

export type GroupedEvents = { live: Event[]; upcoming: Event[]; finished: Event[] };

const byStart = (a: Event, b: Event) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime();

/** Live and upcoming: soonest first. Finished: most recent first. */
export function groupEvents(events: Event[]): GroupedEvents {
  const sorted = [...events].sort(byStart);
  return {
    live: sorted.filter((e) => e.status === "LIVE"),
    upcoming: sorted.filter((e) => e.status === "UPCOMING"),
    finished: sorted.filter((e) => e.status === "FINISHED").reverse()
  };
}
