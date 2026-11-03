"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminEventForm, EventPayload } from "@/components/AdminEventForm";
import { ErrorState } from "@/components/ErrorState";
import { eventService } from "@/services/api/services";

export default function NewEventPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(payload: EventPayload) {
    setLoading(true);
    setError("");
    try {
      await eventService.create(payload);
      router.push("/admin/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  return <AdminLayout><h1 className="mb-6 text-3xl font-black text-navy">Ajouter un événement</h1>{error && <div className="mb-4"><ErrorState message={error} /></div>}<AdminEventForm loading={loading} onSubmit={submit} /></AdminLayout>;
}
