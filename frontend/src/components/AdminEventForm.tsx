"use client";

import { FormEvent } from "react";
import type { Event } from "@/types/domain";
import { fromClubInputValue, toClubInputValue } from "@/utils/dates";

export type EventPayload = {
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  startDatetime: string;
  endDatetime: string;
  organizerName: string;
};

export function AdminEventForm({ event, loading, onSubmit }: { event?: Event; loading?: boolean; onSubmit: (payload: EventPayload) => Promise<void> }) {
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    await onSubmit({
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      location: data.location,
      startDatetime: fromClubInputValue(data.startDatetime),
      endDatetime: fromClubInputValue(data.endDatetime),
      organizerName: data.organizerName
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-lg bg-white p-5 shadow-soft lg:grid-cols-2">
      <Field name="title" label="Titre" defaultValue={event?.title} required />
      <Field name="organizerName" label="Organisateur" defaultValue={event?.organizerName ?? "Judo Club Constantine"} required />
      <Field name="imageUrl" label="Image" defaultValue={event?.imageUrl ?? ""} />
      <Field name="location" label="Lieu" defaultValue={event?.location} required />
      <Field name="startDatetime" label="Date de début (heure d’Algérie)" type="datetime-local" defaultValue={toClubInputValue(event?.startDatetime)} required />
      <Field name="endDatetime" label="Date de fin (heure d’Algérie)" type="datetime-local" defaultValue={toClubInputValue(event?.endDatetime)} required />
      <label className="lg:col-span-2">
        <span className="text-sm font-black text-navy">Description</span>
        <textarea name="description" defaultValue={event?.description} required rows={6} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" />
      </label>
      <button disabled={loading} className="rounded-md bg-redbrand px-5 py-3 text-sm font-black text-white focus-ring disabled:opacity-60 lg:col-span-2">
        {loading ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...inputProps } = props;
  return (
    <label>
      <span className="text-sm font-black text-navy">{label}</span>
      <input {...inputProps} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" />
    </label>
  );
}
