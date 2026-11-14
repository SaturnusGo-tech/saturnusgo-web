import { useCallback, useEffect, useRef, useState } from "react";
import type { TdmConfiguration } from "../../model/configuration/configuration";
type Load = (signal: AbortSignal) => Promise<TdmConfiguration>;
export function useTdmConfiguration(load: Load | null) {
  const [state, setState] = useState<{ value: TdmConfiguration | null; pending: boolean; error: boolean }>({ value: null, pending: Boolean(load), error: false });
  const [revision, setRevision] = useState(0);
  const query = useRef({ load, revision });
  const current = query.current.load === load && query.current.revision === revision;
  useEffect(() => {
    query.current = { load, revision };
    const controller = new AbortController();
    setState({ value: null, pending: Boolean(load), error: false });
    if (load) void load(controller.signal).then(value => {
      if (!controller.signal.aborted) setState({ value, pending: false, error: false });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ value: null, pending: false, error: !(error && typeof error === "object" && "status" in error && error.status === 404) });
    });
    return () => controller.abort();
  }, [load, revision]);
  const visible = current ? state : { value: null, pending: Boolean(load), error: false };
  return { ...visible, retry: useCallback(() => setRevision(value => value + 1), []) };
}
