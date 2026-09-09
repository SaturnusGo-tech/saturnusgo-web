import { useEffect, useRef, useState } from "react";

export function useProjectActivation(workspaceId: string, projectId: string, activate: (id: string) => Promise<boolean>) {
  const action = useRef(activate); action.current = activate;
  const scope = `${workspaceId}:${projectId}`;
  const [result, setResult] = useState<{ scope: string; phase: "loading" | "ready" | "error" }>({ scope, phase: "loading" });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setResult({ scope, phase: "loading" });
    Promise.resolve().then(() => cancelled ? false : action.current(projectId)).then((ready) => {
      if (!cancelled) setResult({ scope, phase: ready ? "ready" : "error" });
    }).catch(() => { if (!cancelled) setResult({ scope, phase: "error" }); });
    return () => { cancelled = true; };
  }, [scope, projectId, version]);
  return { phase: result.scope === scope ? result.phase : "loading", retry: () => setVersion((current) => current + 1) };
}
