export function ErrorState({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-100 bg-red-50 p-5 text-sm font-semibold text-red-700">{message}</div>;
}
