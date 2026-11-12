"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import type { Athlete } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { MutationFeedback } from "@/components/MutationFeedback";
import { inputClass } from "@/components/admin/inputClass";
import { useMutation } from "@/hooks/useMutation";
import { athleteService } from "@/services/api/services";

const SEARCH_DEBOUNCE_MS = 300;

type AthleteInput = { firstName: string; lastName: string; club: string; country: string; profileImageUrl: string };
const empty: AthleteInput = { firstName: "", lastName: "", club: "", country: "", profileImageUrl: "" };
const toInput = (a: Athlete): AthleteInput => ({
  firstName: a.firstName, lastName: a.lastName, club: a.club, country: a.country ?? "", profileImageUrl: a.profileImageUrl ?? ""
});

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[] | null>(null);
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<AthleteInput>(empty);
  const [editing, setEditing] = useState<{ id: number; values: AthleteInput } | null>(null);
  const mutation = useMutation();
  const lastQuery = useRef<string | null>(null);

  // Debounced search: wait 300 ms after typing; reloads after a change are immediate.
  useEffect(() => {
    let active = true;
    const delay = lastQuery.current !== null && lastQuery.current !== query ? SEARCH_DEBOUNCE_MS : 0;
    const timer = setTimeout(() => {
      lastQuery.current = query;
      athleteService.list(query.trim())
        .then((list) => { if (active) { setAthletes(list); setError(""); } })
        .catch((err: Error) => active && setError(err.message));
    }, delay);
    return () => { active = false; clearTimeout(timer); };
  }, [query, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  async function create(e: FormEvent) {
    e.preventDefault();
    const created = await mutation.run(() => athleteService.create(draft), { success: `${draft.firstName} ${draft.lastName} ajouté` });
    if (created) {
      setDraft(empty);
      reload();
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    const { id, values } = editing;
    const updated = await mutation.run(() => athleteService.update(id, values), { success: `${values.firstName} ${values.lastName} modifié` });
    if (updated) {
      setEditing(null);
      reload();
    }
  }

  async function remove(athlete: Athlete) {
    if (!confirm(`Supprimer ${athlete.firstName} ${athlete.lastName} ?`)) return;
    const done = await mutation.run(() => athleteService.delete(athlete.id).then(() => true), { success: "Athlète supprimé" });
    if (done) reload();
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Athlètes</h1>
      {error && <div className="mt-4"><ErrorState message={error} /></div>}
      <MutationFeedback mutation={mutation} className="mt-4" />
      <div className="mt-6 grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={create} className="h-fit rounded-lg bg-white p-5 shadow-soft" aria-label="Ajouter un athlète">
          <h2 className="text-lg font-black text-navy">Ajouter un athlète</h2>
          <AthleteFields values={draft} onChange={setDraft} />
          <button disabled={mutation.pending} className="mt-5 min-h-12 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring disabled:opacity-60">
            {mutation.pending ? "Enregistrement…" : "Ajouter"}
          </button>
        </form>

        <section className="rounded-lg bg-white p-5 shadow-soft" aria-label="Liste des athlètes">
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un athlète (nom, club)"
            aria-label="Rechercher un athlète" className={`${inputClass} mt-0 mb-4`} />
          {athletes === null ? <LoadingState /> : athletes.length === 0 ? (
            <p className="rounded-md bg-slate-50 p-4 text-sm font-bold text-slate-500">{query ? "Aucun athlète trouvé." : "Aucun athlète pour le moment."}</p>
          ) : (
            <ul className="space-y-3">
              {athletes.map((athlete) => editing?.id === athlete.id ? (
                <li key={athlete.id}>
                  <form onSubmit={saveEdit} className="rounded-md bg-soft p-4 ring-2 ring-navy" aria-label={`Modifier ${athlete.firstName} ${athlete.lastName}`}>
                    <div className="grid gap-x-3 sm:grid-cols-2">
                      <AthleteFields values={editing.values} onChange={(values) => setEditing({ id: athlete.id, values })} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button disabled={mutation.pending} className="min-h-11 flex-1 rounded-md bg-navy px-4 text-sm font-black text-white focus-ring disabled:opacity-60">Enregistrer</button>
                      <button type="button" onClick={() => setEditing(null)} className="inline-flex min-h-11 items-center gap-1 rounded-md bg-white px-4 text-sm font-black text-navy focus-ring"><X size={16} /> Annuler</button>
                    </div>
                  </form>
                </li>
              ) : (
                <li key={athlete.id} className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-black text-navy">{athlete.firstName} {athlete.lastName}</p>
                    <p className="truncate text-sm font-semibold text-slate-500">{athlete.club}{athlete.country ? ` • ${athlete.country}` : ""}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setEditing({ id: athlete.id, values: toInput(athlete) })} className="rounded-md bg-white p-2.5 text-navy shadow-sm focus-ring" aria-label={`Modifier ${athlete.firstName} ${athlete.lastName}`}><Pencil size={17} /></button>
                    <button type="button" onClick={() => remove(athlete)} disabled={mutation.pending} className="rounded-md bg-red-50 p-2.5 text-redbrand focus-ring disabled:opacity-50" aria-label={`Supprimer ${athlete.firstName} ${athlete.lastName}`}><Trash2 size={17} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

const fields: { key: keyof AthleteInput; label: string; required?: boolean; type?: string }[] = [
  { key: "firstName", label: "Prénom", required: true },
  { key: "lastName", label: "Nom", required: true },
  { key: "club", label: "Club", required: true },
  { key: "country", label: "Pays" },
  { key: "profileImageUrl", label: "Photo (lien https://…)", type: "url" }
];

function AthleteFields({ values, onChange }: { values: AthleteInput; onChange: (values: AthleteInput) => void }) {
  return (
    <>
      {fields.map(({ key, label, required, type }) => (
        <label key={key} className="mt-4 block">
          <span className="text-sm font-black text-navy">{label}</span>
          <input name={key} type={type ?? "text"} required={required} value={values[key]}
            onChange={(e) => onChange({ ...values, [key]: e.target.value })} className={inputClass} />
        </label>
      ))}
    </>
  );
}
