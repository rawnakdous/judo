"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export const STALE_AFTER_MS = 60_000;

function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `il y a ${s} s`;
  const m = Math.round(s / 60);
  return `il y a ${m} min`;
}

/** "Mis à jour il y a 8 s", or a warning banner when the data is old or the last refresh failed. */
export function LiveFreshness({ snapshotAt, refreshFailed }: { snapshotAt: number; refreshFailed: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const age = now - snapshotAt;
  if (age > STALE_AFTER_MS || refreshFailed) {
    return (
      <div role="status" className="flex items-center gap-2 rounded-md bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 ring-1 ring-amber-200">
        <AlertTriangle size={18} aria-hidden />
        <span>Connexion instable : les informations datent de {ago(age).replace("il y a ", "")}. Nouvelle tentative automatique…</span>
      </div>
    );
  }
  return (
    <p className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500" role="status">
      <RefreshCw size={13} aria-hidden /> Mis à jour {ago(age)}
    </p>
  );
}
