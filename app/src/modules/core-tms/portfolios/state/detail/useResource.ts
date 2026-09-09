import { useEffect, useRef, useState } from "react";
import { toTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";

export function useResource<T>(scope: string, enabled: boolean, load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ scope: string; data: T | null; loading: boolean; error: TmsMutationFailure | null }>({ scope, data: null, loading: enabled, error: null });
  const [revision, setRevision] = useState(0);
  const active = useRef<AbortController | null>(null);
  const latestScope = useRef(scope); latestScope.current = scope;
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const controller = new AbortController(); active.current = controller;
    setState((previous) => ({ scope, data: enabled && previous.scope === scope ? previous.data : null, loading: enabled, error: null }));
    if (enabled) void loadRef.current(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ scope, data, loading: false, error: null });
    }).catch((error) => {
      if (!controller.signal.aborted) setState((previous) => ({ scope, data: previous.scope === scope ? previous.data : null, loading: false, error: toTmsMutationFailure(error) }));
    });
    return () => controller.abort();
  }, [scope, enabled, revision]);
  return { ...(state.scope === scope ? state : { scope, data: null, loading: enabled, error: null }),
    accept: (data: T) => { if (latestScope.current === scope) { active.current?.abort(); setState({ scope, data, loading: false, error: null }); } },
    reload: () => setRevision((value) => value + 1) };
}
