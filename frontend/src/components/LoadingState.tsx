export function LoadingState({ label = "Chargement..." }: { label?: string }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-soft">{label}</div>;
}
