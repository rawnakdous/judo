"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Play, Square, Trash2 } from "lucide-react";
import type { Athlete, Combat, EventLive } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { athleteService, combatService, eventService, tatamiService } from "@/services/api/services";

export default function AdminLivePage() {
  const { id } = useParams<{ id: string }>();
  const [live, setLive] = useState<EventLive | null>(null);
  const [combats, setCombats] = useState<Combat[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [l, c, a] = await Promise.all([eventService.live(id), combatService.list(id), athleteService.list()]);
    setLive(l);
    setCombats(c);
    setAthletes(a);
  }
  useEffect(() => { load().catch((err) => setError(err.message)); }, [id]);

  async function save(e: FormEvent<HTMLFormElement>, tatamiId: number) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await tatamiService.updateLive(id, tatamiId, {
      liveUrl: data.liveUrl,
      active: data.active === "on",
      currentCombatId: data.currentCombatId ? Number(data.currentCombatId) : null
    });
    setMessage("Live mis à jour");
    await load();
  }

  async function createCombat(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    await combatService.create({
      eventId: Number(id),
      tatamiId: Number(data.tatamiId),
      athlete1Id: Number(data.athlete1Id),
      athlete2Id: Number(data.athlete2Id),
      combatNumber: Number(data.combatNumber),
      weightCategory: data.weightCategory,
      ageCategory: data.ageCategory,
      status: data.status,
      scheduledStartTime: data.scheduledStartTime ? new Date(String(data.scheduledStartTime)).toISOString() : null
    });
    form.reset();
    setMessage("Combat créé");
    await load();
  }

  async function removeCombat(combatId: number) {
    if (!confirm("Supprimer ce combat ?")) return;
    await combatService.delete(combatId);
    await load();
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Gestion du Live</h1>
      {message && <p className="mt-3 rounded-md bg-green-50 px-4 py-3 text-sm font-black text-green-700">{message}</p>}
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : !live ? <div className="mt-4"><LoadingState /></div> : (
        <>
          <p className="mt-2 text-sm font-bold text-slate-500">Event: {live.event.title}</p>
          <div className="mt-6 grid gap-5 xl:grid-cols-3">
            {live.tatamis.map((tatami) => (
              <form key={tatami.tatamiId} onSubmit={(e) => save(e, tatami.tatamiId)} className="rounded-lg bg-white p-5 shadow-soft">
                <h2 className="text-xl font-black text-navy">TAPIS {tatami.number}</h2>
                <label className="mt-4 block"><span className="text-sm font-black text-navy">YouTube Live URL</span><input name="liveUrl" defaultValue={tatami.liveUrl ?? ""} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>
                <label className="mt-4 flex items-center gap-3 text-sm font-black text-navy"><input name="active" type="checkbox" defaultChecked={tatami.active} className="h-5 w-5 accent-redbrand" /> Active</label>
                <label className="mt-4 block"><span className="text-sm font-black text-navy">Current combat</span><select name="currentCombatId" defaultValue={tatami.currentCombat?.id ?? ""} className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand"><option value="">Aucun</option>{combats.filter((c) => c.tatamiId === tatami.tatamiId).map((combat) => <option key={combat.id} value={combat.id}>Combat #{combat.combatNumber} - {combat.weightCategory}</option>)}</select></label>
                <button className="mt-5 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring">Enregistrer</button>
              </form>
            ))}
          </div>
          <section className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
            <form onSubmit={createCombat} className="rounded-lg bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-navy">Créer combat</h2>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Tapis</span><select name="tatamiId" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand">{live.tatamis.map((t) => <option key={t.tatamiId} value={t.tatamiId}>{t.name}</option>)}</select></label>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Current athlete 1</span><select name="athlete1Id" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand">{athletes.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}</select></label>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Current athlete 2</span><select name="athlete2Id" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand">{athletes.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}</select></label>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label><span className="text-sm font-black text-navy">N°</span><input name="combatNumber" type="number" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>
                <label><span className="text-sm font-black text-navy">Combat status</span><select name="status" className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand"><option value="UPCOMING">À venir</option><option value="IN_PROGRESS">En direct</option><option value="FINISHED">Terminé</option></select></label>
              </div>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Weight category</span><input name="weightCategory" placeholder="-66 kg" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Age category</span><input name="ageCategory" placeholder="Seniors" required className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>
              <label className="mt-4 block"><span className="text-sm font-black text-navy">Début prévu</span><input name="scheduledStartTime" type="datetime-local" className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" /></label>
              <button className="mt-5 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring">Créer le combat</button>
            </form>
            <section className="rounded-lg bg-white p-5 shadow-soft">
              <h2 className="text-xl font-black text-navy">Combats</h2>
              <div className="mt-4 space-y-3">
                {combats.map((combat) => (
                  <div key={combat.id} className="flex flex-col gap-3 rounded-md bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-navy">Combat #{combat.combatNumber} • Tapis {combat.tatamiNumber}</p>
                      <p className="text-sm font-semibold text-slate-600">{combat.athlete1.firstName} {combat.athlete1.lastName} VS {combat.athlete2.firstName} {combat.athlete2.lastName}</p>
                      <p className="text-xs font-black text-redbrand">{combat.weightCategory} • {combat.ageCategory} • {combat.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => combatService.start(combat.id).then(load)} className="rounded-md bg-green-50 p-2 text-green-700 focus-ring" aria-label="Start"><Play size={17} /></button>
                      <button onClick={() => combatService.finish(combat.id).then(load)} className="rounded-md bg-slate-100 p-2 text-navy focus-ring" aria-label="Finish"><Square size={17} /></button>
                      <button onClick={() => removeCombat(combat.id)} className="rounded-md bg-red-50 p-2 text-redbrand focus-ring" aria-label="Delete"><Trash2 size={17} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>
        </>
      )}
    </AdminLayout>
  );
}
