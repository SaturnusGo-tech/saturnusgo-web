import { useEffect, useRef, useState } from "react";
import { toTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";

export function useResource<T>(scope: string, enabled: boolean, load: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<{ scope: string; data: T | null; loading: boolean; error: TmsMutationFailure | null }>({ scope, data: null, loading: enabled, error: null });
  const [revision, setRevision] = useState(0);
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    const controller = new AbortController();
    setState({ scope, data: null, loading: enabled, error: null });
    if (enabled) void loadRef.current(controller.signal).then((data) => {
      if (!controller.signal.aborted) setState({ scope, data, loading: false, error: null });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ scope, data: null, loading: false, error: toTmsMutationFailure(error) });
    });
    return () => controller.abort();
  }, [scope, enabled, revision]);
  return { ...(state.scope === scope ? state : { scope, data: null, loading: enabled, error: null }),
    reload: () => setRevision((value) => value + 1) };
}
