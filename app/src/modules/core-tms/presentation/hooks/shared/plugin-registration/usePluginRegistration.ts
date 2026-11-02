import { useEffect, useRef, useState } from "react";

type Phase = "idle" | "loading" | "ready" | "error";
type Input = { id: string; accountKey: string; scopeKey: string };
/** Internal UI registration only. Provider authorization and credentials remain in Manage. */
export function usePluginRegistration({ id, accountKey, scopeKey }: Input) {
  const key = id.trim() && accountKey.trim() && scopeKey.trim()
    ? `falcon.plugin.registration.v1:${JSON.stringify([id, accountKey, scopeKey])}` : "";
  const owner = useRef({ key });
  if (owner.current.key !== key) owner.current = { key };
  const busy = useRef<{ key: string } | null>(null);
  const [state, setState] = useState<{ key: string; phase: Phase; prepared: boolean }>({ key: "", phase: "idle", prepared: false });
  useEffect(() => {
    if (owner.current.key !== key) owner.current = { key };
    const lifecycle = owner.current;
    let prepared = false;
    try { prepared = Boolean(key && localStorage.getItem(key) === "installed"); } catch { /* Registration can remain session-only. */ }
    setState({ key, phase: prepared ? "ready" : "idle", prepared });
    return () => { if (owner.current === lifecycle) owner.current = { key: "" }; };
  }, [key]);
  const install = async () => {
    if (!key || busy.current === owner.current) return;
    const requestOwner = owner.current; busy.current = requestOwner;
    setState(current => ({ key, phase: "loading", prepared: current.key === key && current.prepared }));
    try {
      await new Promise(resolve => setTimeout(resolve, 650));
      if (owner.current !== requestOwner) return;
      try { localStorage.setItem(key, "installed"); } catch { /* No provider state or authorization is changed. */ }
      setState({ key, phase: "ready", prepared: true });
    } catch {
      if (owner.current === requestOwner) setState(current => ({ key, phase: "error", prepared: current.key === key && current.prepared }));
    } finally { if (busy.current === requestOwner) busy.current = null; }
  };
  return { phase: state.key === key ? state.phase : "idle", prepared: state.key === key && state.prepared, install };
}
