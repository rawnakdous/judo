"use client";

import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminEventForm, EventPayload } from "@/components/AdminEventForm";
import { MutationFeedback } from "@/components/MutationFeedback";
import { useMutation } from "@/hooks/useMutation";
import { eventService } from "@/services/api/services";

export default function NewEventPage() {
  const router = useRouter();
  const save = useMutation();

  async function submit(payload: EventPayload) {
    const created = await save.run(() => eventService.create(payload), { fallbackError: "Création impossible" });
    if (created) router.push("/admin/events");
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-3xl font-black text-navy">Ajouter un événement</h1>
      <MutationFeedback mutation={save} className="mb-4" />
      <AdminEventForm loading={save.pending} onSubmit={submit} />
    </AdminLayout>
  );
}
