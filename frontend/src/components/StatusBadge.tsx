import clsx from "clsx";
import type { CombatStatus, EventStatus } from "@/types/domain";

const labels: Record<EventStatus | CombatStatus, string> = {
  UPCOMING: "À VENIR",
  LIVE: "LIVE",
  FINISHED: "TERMINÉ",
  IN_PROGRESS: "EN DIRECT"
};

export function StatusBadge({ status }: { status: EventStatus | CombatStatus }) {
  const live = status === "LIVE" || status === "IN_PROGRESS";
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold", live ? "bg-redbrand text-white" : status === "FINISHED" ? "bg-slate-200 text-slate-700" : "bg-white text-navy ring-1 ring-slate-200")}>
      {live && <span className="h-2 w-2 rounded-full bg-white" />}
      {labels[status]}
    </span>
  );
}
