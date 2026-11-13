"use client";

import clsx from "clsx";
import type { Combat, TatamiLive } from "@/types/domain";
import { formatTime } from "@/utils/dates";

const fullName = (a: { firstName: string; lastName: string }) => `${a.firstName} ${a.lastName}`;

/**
 * "Which fight do you want to watch?" — a compact strip of the fights happening right now, one per
 * active mat (like channel tabs above the player). Scrolls horizontally on phones.
 */
export function FightSelector({ tatamis, selectedId, onSelect }: { tatamis: TatamiLive[]; selectedId?: number; onSelect: (id: number) => void }) {
  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Choisir un combat">
      {tatamis.map((tatami) => {
        const selected = selectedId === tatami.tatamiId;
        const combat = tatami.currentCombat;
        return (
          <button
            key={tatami.tatamiId}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onSelect(tatami.tatamiId)}
            className={clsx(
              "min-w-[15rem] shrink-0 snap-start rounded-lg px-3 py-2.5 text-left transition focus-ring sm:min-w-0 sm:flex-1",
              selected ? "bg-navy text-white shadow-soft ring-2 ring-redbrand" : "bg-white text-navy shadow-sm ring-1 ring-slate-200 hover:ring-navy"
            )}
          >
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wide">
              {combat
                ? <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-redbrand" aria-hidden />
                : <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" aria-hidden />}
              <span className={selected ? "text-white/80" : "text-slate-500"}>{tatami.name}</span>
              {combat && <span className={clsx("ml-auto", selected ? "text-white/70" : "text-slate-400")}>{combat.weightCategory}</span>}
            </span>
            {combat ? (
              <span className="mt-1 block truncate text-sm font-black">
                {fullName(combat.athlete1)} <span className="text-redbrand">vs</span> {fullName(combat.athlete2)}
              </span>
            ) : (
              <span className={clsx("mt-1 block truncate text-sm font-bold", selected ? "text-white/70" : "text-slate-500")}>
                En attente du prochain combat
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CurrentCombat({ combat }: { combat?: Combat | null }) {
  if (!combat) {
    return (
      <section className="rounded-lg bg-white p-5 shadow-soft">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Sur le tapis</p>
        <p className="mt-2 text-sm font-bold text-slate-500">Aucun combat en cours. Le prochain va bientôt commencer.</p>
      </section>
    );
  }
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft" aria-label="Combat en cours">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-redbrand px-2.5 py-1 text-[11px] font-black text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden /> EN COURS
        </span>
        <p className="text-sm font-black text-slate-500">Combat #{combat.combatNumber}</p>
      </div>
      <div className="mt-4 space-y-2">
        <AthleteRow name={fullName(combat.athlete1)} club={combat.athlete1.club} corner="bg-white ring-1 ring-slate-300" />
        <p className="pl-6 text-xs font-black uppercase text-redbrand">vs</p>
        <AthleteRow name={fullName(combat.athlete2)} club={combat.athlete2.club} corner="bg-blue-600" />
      </div>
      <p className="mt-4 rounded-md bg-soft px-3 py-2 text-center text-sm font-black text-navy">{combat.weightCategory} · {combat.ageCategory}</p>
    </section>
  );
}

/** Judogi colour marker: first-called athlete in white, second in blue (IJF convention). */
function AthleteRow({ name, club, corner }: { name: string; club: string; corner: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className={clsx("h-3.5 w-3.5 shrink-0 rounded-sm", corner)} aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-lg font-black leading-tight text-navy">{name}</p>
        <p className="truncate text-xs font-semibold text-slate-500">{club}</p>
      </div>
    </div>
  );
}

export function UpcomingCombats({ combats }: { combats: Combat[] }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="text-xs font-black uppercase tracking-wide text-slate-500">À suivre sur ce tapis</h2>
      {combats.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-slate-500">Aucun autre combat programmé.</p>
      ) : (
        <ol className="mt-3 divide-y divide-slate-100">
          {combats.map((combat) => (
            <li key={combat.id} className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-navy">{fullName(combat.athlete1)} <span className="text-redbrand">vs</span> {fullName(combat.athlete2)}</p>
                <p className="text-xs font-bold text-slate-500">#{combat.combatNumber} · {combat.weightCategory} · {combat.ageCategory}</p>
              </div>
              {combat.scheduledStartTime && <time className="shrink-0 text-sm font-black text-redbrand">{formatTime(combat.scheduledStartTime)}</time>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
