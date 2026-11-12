"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import type { TatamiLive } from "@/types/domain";
import { tatamiService } from "@/services/api/services";
import { extractYouTubeVideoId } from "@/utils/youtube";
import { inputClass } from "./inputClass";

/** Stream settings of one mat: YouTube link (with thumbnail preview) and on/off switch. */
export function AdminMatSettings({ eventId, tatami, onSaved }: { eventId: string | number; tatami: TatamiLive; onSaved: () => void }) {
  const [liveUrl, setLiveUrl] = useState(tatami.liveUrl ?? "");
  const [active, setActive] = useState(tatami.active);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const videoId = extractYouTubeVideoId(liveUrl.trim());
  const looksInvalid = liveUrl.trim() !== "" && !videoId;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    try {
      const saved = await tatamiService.updateLive(eventId, tatami.tatamiId, { liveUrl: liveUrl.trim(), active });
      setLiveUrl(saved.liveUrl ?? "");
      setResult({ ok: true, text: "Réglages enregistrés" });
      onSaved();
    } catch (error) {
      setResult({ ok: false, text: error instanceof Error ? error.message : "Enregistrement impossible" });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-5 shadow-soft" aria-label={`Réglages ${tatami.name}`}>
      <h3 className="text-lg font-black text-navy">{tatami.name}</h3>
      <label className="mt-4 block">
        <span className="text-sm font-black text-navy">Lien YouTube Live</span>
        <input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://www.youtube.com/live/…" inputMode="url"
          aria-invalid={looksInvalid} className={inputClass} />
      </label>
      {videoId ? (
        <div className="mt-3 flex items-center gap-3">
          <Image src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt={`Aperçu du live ${tatami.name}`} width={128} height={72} className="rounded-md bg-slate-100 object-cover" />
          <span className="text-xs font-bold text-slate-500">Vidéo {videoId}</span>
        </div>
      ) : looksInvalid ? (
        <p className="mt-2 text-xs font-bold text-redbrand">Collez un lien youtube.com/live/…, youtube.com/watch?v=… ou youtu.be/…</p>
      ) : null}
      <label className="mt-4 flex items-center gap-3 text-sm font-black text-navy">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-5 w-5 accent-redbrand" /> Live activé
      </label>
      <button disabled={pending} className="mt-5 min-h-12 w-full rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white focus-ring disabled:opacity-60">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {result && (
        <p role="status" className={`mt-3 rounded-md px-3 py-2 text-sm font-bold ${result.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-redbrand"}`}>{result.text}</p>
      )}
    </form>
  );
}
