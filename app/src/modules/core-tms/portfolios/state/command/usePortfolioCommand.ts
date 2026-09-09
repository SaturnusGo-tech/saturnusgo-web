import { useEffect, useRef, useState } from "react";
import { toTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { resolvePendingOperation, type PendingOperation } from "../../../../../core/tms/idempotency/pending-operation";

export function usePortfolioCommand(scope: string) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<TmsMutationFailure | null>(null);
  const active = useRef<AbortController | null>(null);
  const operation = useRef<PendingOperation | null>(null);
  const latestScope = useRef(scope);
  latestScope.current = scope;
  useEffect(() => { setPending(false); setError(null); return () => active.current?.abort(); }, [scope]);

  async function run<T>(signature: string, command: (key: string, signal: AbortSignal) => Promise<T>): Promise<T | null> {
    if (active.current && !active.current.signal.aborted) return null;
    const controller = new AbortController();
    active.current = controller;
    operation.current = resolvePendingOperation(operation.current, `${scope}:${signature}`);
    setPending(true); setError(null);
    try {
      const result = await command(operation.current.key, controller.signal);
      if (controller.signal.aborted || latestScope.current !== scope) return null;
      operation.current = null;
      return result;
    } catch (caught) {
      if (!controller.signal.aborted && latestScope.current === scope) setError(toTmsMutationFailure(caught));
      return null;
    } finally {
      controller.abort();
      if (latestScope.current === scope) setPending(false);
    }
  }
  return { pending, error, run };
}
