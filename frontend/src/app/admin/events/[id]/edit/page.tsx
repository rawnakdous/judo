"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Event } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminEventForm, EventPayload } from "@/components/AdminEventForm";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { MutationFeedback } from "@/components/MutationFeedback";
import { useMutation } from "@/hooks/useMutation";
import { eventService } from "@/services/api/services";

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const save = useMutation();

  useEffect(() => {
    let active = true;
    eventService.get(id).then((e) => active && setEvent(e)).catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [id]);

  async function submit(payload: EventPayload) {
    const updated = await save.run(() => eventService.update(id, payload), { fallbackError: "Modification impossible" });
    if (updated) router.push("/admin/events");
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-navy">Modifier l&apos;événement</h1>
      <MutationFeedback mutation={save} className="mb-4" />
      {error ? <ErrorState message={error} /> : !event ? <LoadingState /> : <AdminEventForm event={event} loading={save.pending} onSubmit={submit} />}
    </AdminLayout>
  );
}
