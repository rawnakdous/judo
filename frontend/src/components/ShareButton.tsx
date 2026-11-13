"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Native share sheet when available (phones), otherwise copies the page URL. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return; // user closed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copiez ce lien :", url);
    }
  }

  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-black text-navy shadow focus-ring" aria-label="Partager">
      {copied ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
      <span aria-live="polite">{copied ? "Lien copié" : <span className="hidden sm:inline">Partager</span>}</span>
    </button>
  );
}
