"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const SUCCESS_VISIBLE_MS = 3000;

export type Mutation = {
  pending: boolean;
  error: string | null;
  success: string | null;
  /** Runs `action`; returns its result, or undefined if it failed (the error is then displayed). */
  run: <T>(action: () => Promise<T>, options?: { success?: string; fallbackError?: string }) => Promise<T | undefined>;
  clear: () => void;
};

/**
 * One place for admin write actions: tracks pending state (to disable buttons), shows the API's
 * French error message, and a success message that disappears after 3 s. No silent failures.
 */
export function useMutation(): Mutation {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const clear = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const run = useCallback(async <T,>(action: () => Promise<T>, options?: { success?: string; fallbackError?: string }) => {
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await action();
      if (options?.success) {
        setSuccess(options.success);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setSuccess(null), SUCCESS_VISIBLE_MS);
      }
      return result;
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : options?.fallbackError ?? "Action impossible");
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, success, run, clear };
}
