"use client";

import { useMemo, useState } from "react";
import { Radio } from "lucide-react";
import { toYouTubeEmbedUrl } from "@/utils/youtube";

export function YouTubeLivePlayer({ url, active }: { url?: string | null; active: boolean }) {
  const embedUrl = useMemo(() => toYouTubeEmbedUrl(url), [url]);
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return <PlayerMessage message="Le live de ce tapis n'est pas encore disponible." />;
  }
  if (!embedUrl) {
    return <PlayerMessage message="Le lien du live est invalide." />;
  }
  if (!active) {
    return <PlayerMessage message="Le live est actuellement indisponible." />;
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-soft">
      {!loaded && <div className="absolute inset-0 grid place-items-center text-sm font-bold text-white">Chargement du direct...</div>}
      <iframe
        key={embedUrl}
        src={embedUrl}
        title="YouTube Live"
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

function PlayerMessage({ message }: { message: string }) {
  return (
    <div className="grid aspect-video w-full place-items-center rounded-lg bg-navy p-6 text-center text-white shadow-soft">
      <div>
        <Radio className="mx-auto mb-3 text-redbrand" />
        <p className="text-sm font-bold sm:text-base">{message}</p>
      </div>
    </div>
  );
}
