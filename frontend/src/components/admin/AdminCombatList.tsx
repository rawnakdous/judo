"use client";

import { useState } from "react";
import { Play, RotateCcw, Square, Trash2 } from "lucide-react";
import type { Combat, CombatStatus, TatamiLive } from "@/types/domain";
import { combatStatusLabels } from "@/utils/labels";
import { formatTime } from "@/utils/dates";
import { inputClass } from "./inputClass";

export type CombatActions = {
  start: (c: Combat) => void;
  finish: (c: Combat) => void;
  reset: (c: Combat) => void;
  remove: (c: Combat) => void;
};

/** Fights of the event, sorted by number, filterable by mat and status, with manual overrides. */
export function AdminCombatList({ combats, tatamis, actions }: { combats: Combat[]; tatamis: TatamiLive[]; actions: CombatActions }) {
  const [mat, setMat] = useState<number | "all">("all");
  const [status, setStatus] = useState<CombatStatus | "all">("all");
  const shown = [...combats]
    .sort((a, b) => a.combatNumber - b.combatNumber)
    .filter((c) => (mat === "all" || c.tatamiId === mat) && (status === "all" || c.status === status));

  return (
    <section className="rounded-lg bg-white p-5 shadow-soft" aria-labelledby="combats-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="combats-title" className="text-xl font-black text-navy">Combats <span className="text-sm text-slate-500">({shown.length}/{combats.length})</span></h2>
        <div className="grid grid-cols-2 gap-2 sm:w-96">
          <select aria-label="Filtrer par tapis" value={mat} onChange={(e) => setMat(e.target.value === "all" ? "all" : Number(e.target.value))} className={inputClass}>
            <option value="all">Tous les tapis</option>
            {tatamis.map((t) => <option key={t.tatamiId} value={t.tatamiId}>{t.name}</option>)}
          </select>
          <select aria-label="Filtrer par statut" value={status} onChange={(e) => setStatus(e.target.value as CombatStatus | "all")} className={inputClass}>
            <option value="all">Tous les statuts</option>
            {(Object.keys(combatStatusLabels) as CombatStatus[]).map((s) => <option key={s} value={s}>{combatStatusLabels[s]}</option>)}
          </select>
        </div>
      </div>
      <ul className="mt-4 space-y-3">
        {shown.length === 0 && <li className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">Aucun combat pour ce filtre.</li>}
        {shown.map((combat) => (
          <li key={combat.id} className="flex flex-col gap-3 rounded-md bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-navy">Combat #{combat.combatNumber} • Tapis {combat.tatamiNumber}{combat.scheduledStartTime && <span className="font-bold text-slate-500"> • {formatTime(combat.scheduledStartTime)}</span>}</p>
              <p className="text-sm font-semibold text-slate-600">{combat.athlete1.firstName} {combat.athlete1.lastName} vs {combat.athlete2.firstName} {combat.athlete2.lastName}</p>
              <p className="text-xs font-black text-redbrand">{combat.weightCategory} • {combat.ageCategory} • {combatStatusLabels[combat.status]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {combat.status === "UPCOMING" && <ActionButton label="Démarrer" icon={<Play size={17} />} className="bg-green-50 text-green-700" onClick={() => actions.start(combat)} />}
              {combat.status === "IN_PROGRESS" && <ActionButton label="Terminer" icon={<Square size={17} />} className="bg-slate-100 text-navy" onClick={() => actions.finish(combat)} />}
              {combat.status !== "UPCOMING" && <ActionButton label="Réinitialiser" icon={<RotateCcw size={17} />} className="bg-amber-50 text-amber-800" onClick={() => actions.reset(combat)} />}
              <ActionButton label="Supprimer" icon={<Trash2 size={17} />} className="bg-red-50 text-redbrand" onClick={() => actions.remove(combat)} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ActionButton({ label, icon, className, onClick }: { label: string; icon: React.ReactNode; className: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-black focus-ring ${className}`}>
      {icon} {label}
    </button>
  );
}
