"use client";

import { FormEvent, useRef, useState } from "react";
import { Download, FileUp, Loader2 } from "lucide-react";
import type { CombatImportError } from "@/types/domain";
import { ApiError } from "@/services/api/client";
import { combatService } from "@/services/api/services";

type Outcome =
  | { kind: "ok"; text: string }
  | { kind: "error"; text: string; rows: { row: number; message: string }[] };

/** Upload the event's fight schedule as CSV. All rows must be valid; otherwise nothing is imported. */
export function AdminCombatImport({ eventId, onImported }: { eventId: string | number; onImported: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setPending(true);
    setOutcome(null);
    try {
      const result = await combatService.importCsv(eventId, file);
      setOutcome({
        kind: "ok",
        text: `${result.created} combat${result.created > 1 ? "s" : ""} créé${result.created > 1 ? "s" : ""}, ${result.athletesCreated} athlète${result.athletesCreated > 1 ? "s" : ""} créé${result.athletesCreated > 1 ? "s" : ""}`
      });
      setFile(null);
      if (input.current) input.current.value = "";
      onImported();
    } catch (error) {
      const body = error instanceof ApiError ? (error.body as CombatImportError | undefined) : undefined;
      setOutcome({ kind: "error", text: error instanceof Error ? error.message : "Import impossible", rows: body?.errors ?? [] });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-soft" aria-label="Importer des combats">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-black text-navy">Importer des combats (CSV)</h2>
        <a href="/modele-import-combats.csv" download className="inline-flex items-center gap-1.5 text-sm font-black text-redbrand focus-ring">
          <Download size={16} aria-hidden /> Télécharger le modèle
        </a>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-500">
        Une ligne par combat, séparateur « , » ou « ; », encodage UTF-8. Les athlètes absents sont créés automatiquement.
        Si une ligne est invalide, rien n&apos;est importé.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="flex min-h-12 flex-1 cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 text-sm font-bold text-navy focus-within:ring-2 focus-within:ring-redbrand">
          <FileUp size={18} aria-hidden />
          <span className="truncate">{file ? file.name : "Choisir un fichier .csv"}</span>
          <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" aria-label="Fichier CSV des combats"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setOutcome(null); }} />
        </label>
        <button disabled={!file || pending} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-navy px-5 text-sm font-black text-white focus-ring disabled:opacity-50">
          {pending && <Loader2 size={16} className="animate-spin" aria-hidden />} Importer
        </button>
      </div>

      {outcome?.kind === "ok" && (
        <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-700">{outcome.text}</p>
      )}
      {outcome?.kind === "error" && (
        <div role="alert" className="mt-4 rounded-md bg-red-50 p-3">
          <p className="text-sm font-black text-redbrand">{outcome.text}</p>
          {outcome.rows.length > 0 && (
            <div className="mt-3 max-h-72 overflow-auto rounded border border-red-100 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-red-50 text-xs uppercase text-redbrand">
                  <tr><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Problème</th></tr>
                </thead>
                <tbody>
                  {outcome.rows.map((r) => (
                    <tr key={r.row} className="border-t border-red-100">
                      <td className="px-3 py-2 font-black text-navy">{r.row}</td>
                      <td className="px-3 py-2 font-semibold text-slate-700">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
