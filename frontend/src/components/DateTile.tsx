import clsx from "clsx";
import { formatDayMonth } from "@/utils/dates";

/** Small calendar-page tile ("20 / DÉC.") used on event cards and headers. */
export function DateTile({ value, className }: { value: string; className?: string }) {
  const { day, month } = formatDayMonth(value);
  return (
    <div className={clsx("grid w-14 overflow-hidden rounded-md bg-white text-center shadow-md", className)} aria-hidden>
      <span className="bg-redbrand py-0.5 text-[10px] font-black uppercase tracking-wide text-white">{month.replace(".", "")}</span>
      <span className="py-1 text-xl font-black leading-none text-navy">{day}</span>
    </div>
  );
}
