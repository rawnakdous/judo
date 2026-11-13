"use client";

import { FormEvent, useState } from "react";
import type { Athlete, Combat, TatamiLive } from "@/types/domain";
import { combatService } from "@/services/api/services";
import { fromClubInputValue } from "@/utils/dates";
import { AthletePicker } from "./AthletePicker";
import { inputClass } from "./inputClass";

export function nextFreeCombatNumber(combats: Combat[]) {
  return combats.reduce((max, c) => Math.max(max, c.combatNumber), 0) + 1;
}

/** Creates an UPCOMING fight (status is never sent; the server decides). */
export function AdminCombatForm({ eventId, tatamis, athletes, combats, onCreated }: {
  eventId: string | number;
  tatamis: TatamiLive[];
  athletes: Athlete[];
  combats: Combat[];
  onCreated: (message: string) => void;
}) {
  const [tatamiId, setTatamiId] = useState<number | null>(tatamis[0]?.tatamiId ?? null);
  const [athlete1Id, setAthlete1Id] = useState<number | null>(null);
  const [athlete2Id, setAthlete2Id] = useState<number | null>(null);
  const [numberInput, setNumberInput] = useState<string | null>(null); // null = use the suggestion
  const [weightCategory, setWeightCategory] = useState("");
  const [ageCategory, setAgeCategory] = useState("");
  const [scheduled, setScheduled] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const suggested = nextFreeCombatNumber(combats);
  const number = numberInput ?? String(suggested);

  function pickAthlete1(id: number | null) {
    setAthlete1Id(id);
    if (id !== null && id === athlete2Id) setAthlete2Id(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!tatamiId || !athlete1Id || !athlete2Id) return;
    setPending(true);
    setError("");
    try {
      const created = await combatService.create({
        eventId: Number(eventId),
        tatamiId,
        athlete1Id,
        athlete2Id,
        combatNumber: Number(number),
        weightCategory: weightCategory.trim(),
        ageCategory: ageCategory.trim(),
        scheduledStartTime: scheduled ? fromClubInputValue(scheduled) : null
      });
      // keep mat and categories (fights are usually entered in series), clear the rest
      setAthlete1Id(null);
      setAthlete2Id(null);
      setNumberInput(null);
      setScheduled("");
      onCreated(`Combat #${created.combatNumber} créé`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-soft" aria-label="Ajouter un combat">
      <h2 className="text-xl font-black text-navy">Ajouter un combat</h2>
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">Tapis</span>
        <select required value={tatamiId ?? ""} onChange={(e) => setTatamiId(Number(e.target.value))} className={inputClass}>
          {tatamis.map((t) => <option key={t.tatamiId} value={t.tatamiId}>{t.name}</option>)}
        </select>
      </label>
      <AthletePicker name="athlete1Id" title="Athlète 1" athletes={athletes} value={athlete1Id} onChange={pickAthlete1} />
      <AthletePicker name="athlete2Id" title="Athlète 2" athletes={athletes} value={athlete2Id} onChange={setAthlete2Id} excludeId={athlete1Id} />
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">N° du combat</span>
        <input type="number" min={1} required value={number} onChange={(e) => setNumberInput(e.target.value)} className={inputClass} />
        {numberInput === null && <span className="mt-1 block text-xs font-bold text-slate-500">Prochain numéro libre</span>}
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">Catégorie de poids</span>
        <input required value={weightCategory} onChange={(e) => setWeightCategory(e.target.value)} placeholder="-66 kg" className={inputClass} />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">Catégorie d&apos;âge</span>
        <input required value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} placeholder="Seniors" className={inputClass} />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">Début prévu (heure d’Algérie)</span>
        <input type="datetime-local" value={scheduled} onChange={(e) => setScheduled(e.target.value)} className={inputClass} />
      </label>
      {error && <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-redbrand">{error}</p>}
      <button disabled={pending} className="mt-5 min-h-12 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring disabled:opacity-60">
        {pending ? "Création…" : "Créer le combat"}
      </button>
    </form>
  );
}
