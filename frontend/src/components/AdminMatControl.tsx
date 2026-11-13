"use client";

import { useState } from "react";
import { CheckCircle2, ChevronsRight, Loader2, TriangleAlert } from "lucide-react";
import clsx from "clsx";
import type { Combat, StaleTatamiError, TatamiLive } from "@/types/domain";
import { ApiError } from "@/services/api/client";
import { tatamiService } from "@/services/api/services";

const name = (a: { firstName: string; lastName: string }) => `${a.firstName} ${a.lastName}`;
const matchup = (c: Combat) => `${name(c.athlete1)} vs ${name(c.athlete2)}`;

type Notice = { kind: "ok" | "warn" | "error"; text: string } | null;

function nextLabel(tatami: TatamiLive) {
  const next = tatami.upcomingCombats[0];
  if (tatami.currentCombat) return next ? "Combat suivant" : "Terminer le dernier combat";
  return next ? `Démarrer le combat #${next.combatNumber}` : "Aucun combat prévu";
}

/**
 * Mat-side operator card: what is on the mat now, what comes next, and one big button.
 * The request carries the current fight id the operator sees, so a double tap or a retry on bad
 * Wi-Fi cannot skip a fight (the server answers 409 with the real state, which we display).
 */
export function AdminMatControl({ eventId, tatami, onChange }: {
  eventId: string | number;
  tatami: TatamiLive;
  onChange: (tatami: TatamiLive) => void;
}) {
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const current = tatami.currentCombat;
  const next = tatami.upcomingCombats[0];
  const disabled = pending || (!current && !next);

  async function advance() {
    setPending(true);
    setNotice(null);
    try {
      const updated = await tatamiService.next(eventId, tatami.tatamiId, current?.id ?? null);
      onChange(updated);
      setNotice(updated.currentCombat
        ? { kind: "ok", text: `Combat #${updated.currentCombat.combatNumber} en cours` }
        : { kind: "ok", text: "Tapis libre : plus de combat prévu" });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && (error.body as StaleTatamiError | undefined)?.tatami) {
        onChange((error.body as StaleTatamiError).tatami);
        setNotice({ kind: "warn", text: "Le tapis a déjà été mis à jour. Vérifiez l'affichage avant de réessayer." });
      } else {
        setNotice({ kind: "error", text: error instanceof Error ? error.message : "Action impossible" });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="flex flex-col rounded-lg bg-white p-4 shadow-soft sm:p-5" aria-labelledby={`mat-${tatami.tatamiId}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={`mat-${tatami.tatamiId}`} className="text-xl font-black text-navy">{tatami.name}</h2>
        <span className={clsx("rounded-full px-2.5 py-1 text-xs font-black", tatami.active ? "bg-redbrand text-white" : "bg-slate-200 text-slate-600")}>
          {tatami.active ? "LIVE" : "Live désactivé"}
        </span>
      </div>

      <div className="mt-4 rounded-md bg-soft p-3">
        <p className="text-xs font-black uppercase text-slate-500">En cours</p>
        {current ? (
          <>
            <p className="mt-1 text-base font-black leading-snug text-navy">{matchup(current)}</p>
            <p className="text-xs font-bold text-slate-500">#{current.combatNumber} · {current.weightCategory} · {current.ageCategory}</p>
          </>
        ) : (
          <p className="mt-1 text-sm font-bold text-slate-500">Aucun combat sur le tapis</p>
        )}
      </div>

      <p className="mt-3 text-sm font-semibold text-slate-600">
        <span className="font-black text-navy">Ensuite : </span>
        {next ? `#${next.combatNumber} ${matchup(next)}` : "rien de prévu"}
      </p>

      <button
        type="button"
        onClick={advance}
        disabled={disabled}
        aria-busy={pending}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-redbrand px-4 py-4 text-base font-black text-white shadow-soft focus-ring disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {pending ? <Loader2 className="animate-spin" size={20} aria-hidden /> : <ChevronsRight size={22} aria-hidden />}
        {nextLabel(tatami)}
      </button>

      {notice && (
        <p role="status" className={clsx("mt-3 flex items-start gap-2 rounded-md px-3 py-2 text-sm font-bold",
          notice.kind === "ok" ? "bg-green-50 text-green-700" : notice.kind === "warn" ? "bg-amber-50 text-amber-800" : "bg-red-50 text-redbrand")}>
          {notice.kind === "ok" ? <CheckCircle2 size={18} aria-hidden /> : <TriangleAlert size={18} aria-hidden />}
          {notice.text}
        </p>
      )}
    </section>
  );
}
