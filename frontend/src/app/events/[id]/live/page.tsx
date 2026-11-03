"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { EventLive } from "@/types/domain";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { StatusBadge } from "@/components/StatusBadge";
import { TatamiSelector, CurrentCombat, UpcomingCombats } from "@/components/LiveComponents";
import { YouTubeLivePlayer } from "@/components/YouTubeLivePlayer";
import { eventService } from "@/services/api/services";

export default function LivePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<EventLive | null>(null);
  const [selected, setSelected] = useState<number | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const live = await eventService.live(id);
        if (!mounted) return;
        setData(live);
        setSelected((current) => current ?? live.tatamis[0]?.tatamiId);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Live indisponible");
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const tatami = useMemo(() => data?.tatamis.find((item) => item.tatamiId === selected) ?? data?.tatamis[0], [data, selected]);

  if (error) return <PageShell><ErrorState message={error} /></PageShell>;
  if (!data || !tatami) return <PageShell><LoadingState label="Chargement du live..." /></PageShell>;

  return (
    <PageShell>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Link href={`/events/${id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-navy shadow focus-ring"><ArrowLeft size={18} /> Retour</Link>
        <StatusBadge status="LIVE" />
      </div>
      <div className="mb-5">
        <p className="text-sm font-black text-redbrand">{data.event.title}</p>
        <h1 className="text-3xl font-black text-navy sm:text-4xl">Les 3 tapis en direct</h1>
      </div>
      <div className="mb-5"><TatamiSelector tatamis={data.tatamis} selectedId={tatami.tatamiId} onSelect={setSelected} /></div>
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <YouTubeLivePlayer url={tatami.liveUrl} active={tatami.active} />
        </div>
        <CurrentCombat combat={tatami.currentCombat} />
      </div>
      <div className="mt-5">
        <UpcomingCombats combats={tatami.upcomingCombats} />
      </div>
    </PageShell>
  );
}
