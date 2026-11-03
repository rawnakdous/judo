import clsx from "clsx";

export function BrandMark({ compact = false, dark = false }: { compact?: boolean; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={clsx("grid place-items-center rounded-full", compact ? "h-10 w-10" : "h-12 w-12", dark ? "bg-white" : "bg-navy")}>
        <span className={clsx("font-black", compact ? "text-lg" : "text-2xl", dark ? "text-redbrand" : "text-white")}>J</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <p className={clsx("text-sm font-black tracking-wide", dark ? "text-white" : "text-navy")}>JUDO CLUB</p>
          <p className="text-sm font-black tracking-wide text-redbrand">CONSTANTINE</p>
        </div>
      )}
    </div>
  );
}
