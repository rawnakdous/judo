"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { Athlete, Combat, EventLive, TatamiLive } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminMatControl } from "@/components/AdminMatControl";
import { AdminMatSettings } from "@/components/admin/AdminMatSettings";
import { AdminCombatForm } from "@/components/admin/AdminCombatForm";
import { AdminCombatList, type CombatActions } from "@/components/admin/AdminCombatList";
import { AdminCombatImport } from "@/components/admin/AdminCombatImport";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { athleteService, combatService, eventService } from "@/services/api/services";
import { MutationFeedback } from "@/components/MutationFeedback";
import { useMutation } from "@/hooks/useMutation";

const ADMIN_POLL_MS = 10_000;

export default function AdminLivePage() {
  const { id } = useParams<{ id: string }>();
  const [live, setLive] = useState<EventLive | null>(null);
  const [combats, setCombats] = useState<Combat[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const mutation = useMutation();
  const [error, setError] = useState("");

  /** Live state + fight list. Polled so several admins (or a second phone) stay in sync. */
  const load = useCallback(() => {
    return Promise.all([eventService.live(id, { fresh: true }), combatService.list(id)])
      .then(([l, c]) => {
        setLive(l);
        setCombats(c);
      });
  }, [id]);

  useEffect(() => {
    let active = true;
    load().catch((err) => active && setError(err.message));
    athleteService.list().then((a) => active && setAthletes(a)).catch(() => {});
    const timer = setInterval(() => { load().catch(() => {}); }, ADMIN_POLL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [load]);

  function replaceTatami(updated: TatamiLive) {
    setLive((current) => current && { ...current, tatamis: current.tatamis.map((t) => (t.tatamiId === updated.tatamiId ? updated : t)) });
    combatService.list(id).then(setCombats).catch(() => {});
  }

  /** Runs an admin action, shows its outcome and refreshes. */
  async function run(action: () => Promise<unknown>, done: string) {
    await mutation.run(action, { success: done });
    await load().catch(() => {});
  }

  const actions: CombatActions = {
    start: (c) => run(() => combatService.start(c.id), `Combat #${c.combatNumber} démarré`),
    finish: (c) => run(() => combatService.finish(c.id), `Combat #${c.combatNumber} terminé`),
    reset: (c) => {
      if (!confirm(`Remettre le combat #${c.combatNumber} « à venir » ? Ses heures de début et de fin seront effacées.`)) return;
      void run(() => combatService.reset(c.id), `Combat #${c.combatNumber} remis à venir`);
    },
    remove: (c) => {
      if (!confirm(`Supprimer le combat #${c.combatNumber} ?`)) return;
      void run(() => combatService.delete(c.id), `Combat #${c.combatNumber} supprimé`);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Gestion du Live</h1>
      <MutationFeedback mutation={mutation} className="mt-3" />
      {error ? <div className="mt-4"><ErrorState message={error} /></div> : !live ? <div className="mt-4"><LoadingState /></div> : (
        <>
          <p className="mt-2 text-sm font-bold text-slate-500">Événement : {live.event.title}</p>

          <h2 className="mt-6 text-lg font-black text-navy">Contrôle des tapis</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {live.tatamis.map((tatami) => (
              <AdminMatControl key={tatami.tatamiId} eventId={id} tatami={tatami} onChange={replaceTatami} />
            ))}
          </div>

          <section className="mt-6 grid gap-5 xl:grid-cols-[380px_1fr]">
            <AdminCombatForm eventId={id} tatamis={live.tatamis} athletes={athletes} combats={combats}
              onCreated={(text) => { void run(() => Promise.resolve(), text); }} />
            <AdminCombatList combats={combats} tatamis={live.tatamis} actions={actions} />
          </section>

          <div className="mt-6">
            <AdminCombatImport eventId={id} onImported={() => { void load(); }} />
          </div>

          <h2 className="mt-8 text-lg font-black text-navy">Réglages des tapis</h2>
          <div className="mt-3 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {live.tatamis.map((tatami) => (
              <AdminMatSettings key={tatami.tatamiId} eventId={id} tatami={tatami} onSaved={() => { void load(); }} />
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  );
}
