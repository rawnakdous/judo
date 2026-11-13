"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { FightSelector, CurrentCombat, UpcomingCombats } from "@/components/LiveComponents";
import { LiveFreshness } from "@/components/LiveFreshness";
import { YouTubeLivePlayer } from "@/components/YouTubeLivePlayer";
import { useLivePolling } from "@/hooks/useLivePolling";

export default function LivePage() {
  return (
    <PageShell>
      <Suspense fallback={<LoadingState label="Chargement du live..." />}>
        <LiveView />
      </Suspense>
    </PageShell>
  );
}

function LiveView() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data, snapshotAt, initialError, refreshFailed } = useLivePolling(id);

  if (initialError && !data) return <ErrorState message={initialError} />;
  if (!data || snapshotAt === null) return <LoadingState label="Chargement du live..." />;

  const back = (
    <Link href={`/events/${id}`} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-navy shadow focus-ring"><ArrowLeft size={18} /> Retour</Link>
  );

  if (data.event.status !== "LIVE") {
    return (
      <>
        <div className="mb-5">{back}</div>
        <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-center shadow-soft">
          <Radio className="mx-auto text-redbrand" size={36} aria-hidden />
          <h1 className="mt-4 text-2xl font-black text-navy">
            {data.event.status === "UPCOMING" ? "Le live n'a pas encore commencé" : "Le live est terminé"}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{data.event.title}</p>
          <Link href={`/events/${id}`} className="mt-6 inline-flex rounded-md bg-navy px-5 py-3 text-sm font-black text-white focus-ring">Voir l&apos;événement</Link>
        </div>
      </>
    );
  }

  const activeMats = data.tatamis.filter((t) => t.active);
  const requested = Number(params.get("tapis"));
  const tatami = activeMats.find((t) => t.tatamiId === requested)
    ?? activeMats.find((t) => t.currentCombat)
    ?? activeMats[0];

  function select(tatamiId: number) {
    const query = new URLSearchParams(params.toString());
    query.set("tapis", String(tatamiId));
    router.replace(`${pathname}?${query.toString()}`, { scroll: false });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <Link href={`/events/${id}`} aria-label="Retour à l'événement" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-navy shadow focus-ring">
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black uppercase tracking-wide text-redbrand">{data.event.title}</p>
          <h1 className="text-2xl font-black leading-tight text-navy sm:text-3xl">
            {activeMats.length === 0 ? "Aucun tapis en direct" : `${activeMats.length} tapis en direct`}
          </h1>
        </div>
        <div className="w-full sm:w-auto"><LiveFreshness snapshotAt={snapshotAt} refreshFailed={refreshFailed} /></div>
      </div>

      {!tatami ? (
        <div className="rounded-lg bg-white p-8 text-center text-sm font-bold text-slate-500 shadow-soft">
          Les directs vont bientôt commencer. Cette page se met à jour automatiquement.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-3">
            {activeMats.length > 1 && <FightSelector tatamis={activeMats} selectedId={tatami.tatamiId} onSelect={select} />}
            <YouTubeLivePlayer url={tatami.liveUrl} active={tatami.active} />
          </div>
          <aside className="space-y-4" aria-label={`Combats sur ${tatami.name}`}>
            <CurrentCombat combat={tatami.currentCombat} />
            <UpcomingCombats combats={tatami.upcomingCombats} />
          </aside>
        </div>
      )}
    </>
  );
}
