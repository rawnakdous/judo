"use client";

import clsx from "clsx";
import type { Combat, TatamiLive } from "@/types/domain";
import { StatusBadge } from "./StatusBadge";

export function TatamiSelector({ tatamis, selectedId, onSelect }: { tatamis: TatamiLive[]; selectedId?: number; onSelect: (id: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg bg-white p-2 shadow-soft" role="tablist" aria-label="Sélection du tapis">
      {tatamis.map((tatami) => (
        <button key={tatami.tatamiId} role="tab" aria-selected={selectedId === tatami.tatamiId} onClick={() => onSelect(tatami.tatamiId)} className={clsx("rounded-md px-3 py-3 text-sm font-black focus-ring", selectedId === tatami.tatamiId ? "bg-redbrand text-white" : "bg-slate-100 text-navy hover:bg-slate-200")}>
          {tatami.name}
        </button>
      ))}
    </div>
  );
}

export function CurrentCombat({ combat }: { combat?: Combat | null }) {
  if (!combat) {
    return <div className="rounded-lg bg-white p-5 shadow-soft"><p className="text-sm font-bold text-slate-500">Aucun combat en direct sur ce tapis.</p></div>;
  }
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <StatusBadge status={combat.status} />
        <p className="text-sm font-black text-navy">Combat #{combat.combatNumber}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <AthleteBlock name={`${combat.athlete1.firstName} ${combat.athlete1.lastName}`} club={combat.athlete1.club} />
        <div className="rounded-full bg-navy px-3 py-2 text-xs font-black text-white">VS</div>
        <AthleteBlock name={`${combat.athlete2.firstName} ${combat.athlete2.lastName}`} club={combat.athlete2.club} alignRight />
      </div>
      <p className="mt-5 rounded-md bg-slate-100 px-3 py-2 text-center text-sm font-black text-navy">{combat.weightCategory} • {combat.ageCategory}</p>
    </section>
  );
}

function AthleteBlock({ name, club, alignRight = false }: { name: string; club: string; alignRight?: boolean }) {
  return (
    <div className={clsx("min-w-0", alignRight && "text-right")}>
      <h3 className="truncate text-base font-black text-navy sm:text-lg">{name}</h3>
      <p className="mt-1 line-clamp-2 text-xs font-semibold text-slate-500 sm:text-sm">{club}</p>
    </div>
  );
}

export function UpcomingCombats({ combats }: { combats: Combat[] }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="mb-4 text-lg font-black text-navy">Prochains combats sur ce tapis</h2>
      {combats.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500">Aucun prochain combat programmé.</p>
      ) : (
        <div className="space-y-3">
          {combats.map((combat) => (
            <div key={combat.id} className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-sm font-black text-navy">Combat #{combat.combatNumber}</p>
                <p className="text-xs font-bold text-slate-500">{combat.weightCategory} • {combat.ageCategory}</p>
              </div>
              <time className="text-sm font-black text-redbrand">{combat.scheduledStartTime ? new Intl.DateTimeFormat("fr-DZ", { hour: "2-digit", minute: "2-digit" }).format(new Date(combat.scheduledStartTime)) : "--:--"}</time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
