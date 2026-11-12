import { CheckCircle2 } from "lucide-react";
import type { Mutation } from "@/hooks/useMutation";
import { ErrorState } from "./ErrorState";

/** Error (stays until the next action) or success (auto-hides) of a useMutation. */
export function MutationFeedback({ mutation, className = "" }: { mutation: Pick<Mutation, "error" | "success">; className?: string }) {
  if (mutation.error) return <div className={className} role="alert"><ErrorState message={mutation.error} /></div>;
  if (mutation.success) {
    return (
      <p role="status" className={`flex items-center gap-2 rounded-md bg-green-50 px-4 py-3 text-sm font-black text-green-700 ${className}`}>
        <CheckCircle2 size={18} aria-hidden /> {mutation.success}
      </p>
    );
  }
  return null;
}
