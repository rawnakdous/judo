"use client";

import { FormEvent, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Athlete } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { ErrorState } from "@/components/ErrorState";
import { athleteService } from "@/services/api/services";

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  async function load(q = query) {
    athleteService.list(q).then(setAthletes).catch((err) => setError(err.message));
  }
  useEffect(() => { load(""); }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    await athleteService.create(Object.fromEntries(new FormData(form)));
    form.reset();
    await load("");
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cet athlète ?")) return;
    await athleteService.delete(id);
    await load();
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Athlètes</h1>
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
      <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="text-lg font-black text-navy">Créer athlète</h2>
          {["firstName:Prénom", "lastName:Nom", "club:Club", "country:Pays", "profileImageUrl:Image"].map((item) => {
            const [name, label] = item.split(":");
            return <label key={name} className="mt-4 block"><span className="text-sm font-black text-navy">{label}</span><input name={name} required={name !== "country" && name !== "profileImageUrl"} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>;
          })}
          <button className="mt-5 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring">Créer</button>
        </form>
        <section className="rounded-lg bg-white p-5 shadow-soft">
          <input value={query} onChange={(e) => { setQuery(e.target.value); load(e.target.value); }} placeholder="Search athlete" className="mb-4 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" />
          <div className="space-y-3">
            {athletes.map((athlete) => (
              <div key={athlete.id} className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3">
                <div><p className="font-black text-navy">{athlete.firstName} {athlete.lastName}</p><p className="text-sm font-semibold text-slate-500">{athlete.club} • {athlete.country ?? "N/A"}</p></div>
                <button onClick={() => remove(athlete.id)} className="rounded-md bg-red-50 p-2 text-redbrand focus-ring" aria-label="Delete"><Trash2 size={17} /></button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
