"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Edit, Plus, Radio, Trash2 } from "lucide-react";
import type { Event } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { EventImage } from "@/components/EventImage";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { eventService } from "@/services/api/services";
import { formatShortDate } from "@/utils/dates";
import { MutationFeedback } from "@/components/MutationFeedback";
import { useMutation } from "@/hooks/useMutation";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const mutation = useMutation();

  function load() {
    return eventService.list().then(setEvents).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function remove(event: Event) {
    if (!confirm(`Supprimer « ${event.title} » ? Ses tapis et combats seront aussi supprimés.`)) return;
    await mutation.run(() => eventService.delete(event.id), { success: `« ${event.title} » supprimé` });
    await load();
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-black text-navy">Gestion des événements</h1>
        <Link href="/admin/events/new" className="inline-flex items-center justify-center gap-2 rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring"><Plus size={18} /> Ajouter un événement</Link>
      </div>
      <MutationFeedback mutation={mutation} className="mb-4" />
      {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-soft">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Image</th><th>Nom</th><th>Date</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="border-t border-slate-100">
                  <td className="p-4"><div className="relative h-14 w-20 overflow-hidden rounded-md bg-slate-100"><EventImage src={event.imageUrl} alt="" sizes="80px" /></div></td>
                  <td className="font-black text-navy">{event.title}</td>
                  <td className="font-semibold text-slate-600">{formatShortDate(event.startDatetime)}</td>
                  <td><StatusBadge status={event.status} /></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/admin/events/${event.id}/edit`} className="rounded-md bg-slate-100 p-2 text-navy focus-ring" aria-label="Modifier"><Edit size={17} /></Link>
                      <Link href={`/admin/events/${event.id}/live`} className="rounded-md bg-slate-100 p-2 text-redbrand focus-ring" aria-label="Gérer le live"><Radio size={17} /></Link>
                      <button onClick={() => remove(event)} disabled={mutation.pending} className="rounded-md bg-red-50 p-2 text-redbrand focus-ring disabled:opacity-50" aria-label="Supprimer"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
