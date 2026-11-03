"use client";

import { useEffect, useState } from "react";
import type { Event } from "@/types/domain";
import { PageShell } from "@/components/PageShell";
import { EventCard } from "@/components/EventCard";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { eventService } from "@/services/api/services";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    eventService.list()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-3xl font-black text-navy sm:text-4xl">Événements</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Restez informé et suivez nos événements en direct.</p>
      </div>
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : events.length === 0 ? <EmptyState message="Aucun événement disponible." /> : (
        <div className="grid gap-4 xl:grid-cols-2">
          {events.map((event) => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </PageShell>
  );
}
