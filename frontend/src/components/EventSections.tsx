"use client";

import { useState } from "react";
import type { Event } from "@/types/domain";
import { EventCard } from "./EventCard";
import { FeaturedLiveEvent } from "./FeaturedLiveEvent";
import { EmptyState } from "./EmptyState";
import { groupEvents } from "@/utils/events";

export const FINISHED_PAGE_SIZE = 6;

/** Events page body: "En direct", "À venir", "Terminés" — each section hidden when empty. */
export function EventSections({ events }: { events: Event[] }) {
  const { live, upcoming, finished } = groupEvents(events);
  const [finishedShown, setFinishedShown] = useState(FINISHED_PAGE_SIZE);

  if (events.length === 0) {
    return <EmptyState message="Aucun événement pour le moment. Revenez bientôt !" />;
  }

  return (
    <div className="space-y-10">
      {live.length > 0 && (
        <Section id="en-direct" title="En direct" accent>
          {live.map((event) => (
            <div key={event.id} className="xl:col-span-2"><FeaturedLiveEvent event={event} /></div>
          ))}
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section id="a-venir" title="À venir">
          {upcoming.map((event) => <EventCard key={event.id} event={event} />)}
        </Section>
      )}

      {finished.length > 0 && (
        <Section id="termines" title="Terminés">
          {finished.slice(0, finishedShown).map((event) => <EventCard key={event.id} event={event} />)}
          {finished.length > finishedShown && (
            <div className="xl:col-span-2">
              <button
                type="button"
                onClick={() => setFinishedShown((n) => n + FINISHED_PAGE_SIZE)}
                className="w-full rounded-md bg-white px-4 py-3 text-sm font-black text-navy shadow-soft focus-ring"
              >
                Afficher plus ({finished.length - finishedShown})
              </button>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ id, title, accent = false, children }: { id: string; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mb-4 flex items-center gap-2 text-xl font-black text-navy">
        {accent && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-redbrand" aria-hidden />}
        {title}
      </h2>
      <div className="grid gap-4 xl:grid-cols-2">{children}</div>
    </section>
  );
}
