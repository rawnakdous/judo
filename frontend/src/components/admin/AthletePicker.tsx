"use client";

import { useId, useState } from "react";
import type { Athlete } from "@/types/domain";
import { inputClass } from "./inputClass";

const label = (a: Athlete) => `${a.firstName} ${a.lastName} — ${a.club}`;
const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/** Searchable athlete select (search by name or club, accents ignored). `excludeId` hides the opponent. */
export function AthletePicker({ name, title, athletes, value, onChange, excludeId }: {
  name: string;
  title: string;
  athletes: Athlete[];
  value: number | null;
  onChange: (id: number | null) => void;
  excludeId?: number | null;
}) {
  const [query, setQuery] = useState("");
  const id = useId();
  const q = normalize(query.trim());
  const options = athletes
    .filter((a) => a.id !== excludeId)
    .filter((a) => !q || normalize(label(a)).includes(q) || a.id === value);

  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-black text-navy">{title}</legend>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (nom, club)…"
        aria-label={`Rechercher ${title.toLowerCase()}`} aria-controls={id} className={inputClass} />
      <select id={id} name={name} required value={value ?? ""} aria-label={title}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)} className={inputClass}>
        <option value="">— Choisir —</option>
        {options.map((a) => <option key={a.id} value={a.id}>{label(a)}</option>)}
      </select>
      {q && options.length === 0 && <p className="mt-1 text-xs font-bold text-slate-500">Aucun athlète trouvé</p>}
    </fieldset>
  );
}
