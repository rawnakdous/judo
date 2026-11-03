"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Event } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminEventForm, EventPayload } from "@/components/AdminEventForm";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { eventService } from "@/services/api/services";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => { eventService.get(id).then(setEvent).catch((err) => setError(err.message)); }, [id]);

  async function submit(payload: EventPayload) {
    await eventService.update(id, payload);
    router.push("/admin/events");
  }

  return <AdminLayout><h1 className="mb-6 text-3xl font-black text-navy">Modifier l'événement</h1>{error ? <ErrorState message={error} /> : !event ? <LoadingState /> : <AdminEventForm event={event} onSubmit={submit} />}</AdminLayout>;
}
