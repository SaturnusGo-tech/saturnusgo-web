import { useEffect, useRef, useState } from "react";
import type { CodexEmployee } from "../../../domain/model/codex-employee";
import { CODEX_PLUGIN_VERSION } from "../../../domain/model/codex-plugin";
import { prepareCodexInstallation } from "../../../application/installation/prepareCodexInstallation";

type Phase = "idle" | "loading" | "ready" | "error";
export function useCodexInstall(setup: CodexEmployee["setup"] | undefined, accountKey: string) {
  const key = setup ? `falcon.codex.installation.v2:${accountKey}:${JSON.stringify(setup)}:${CODEX_PLUGIN_VERSION}` : "";
  const owner = useRef({ key });
  if (owner.current.key !== key) owner.current = { key };
  const busy = useRef<{ key: string } | null>(null);
  const [state, setState] = useState<{ key: string; phase: Phase; prepared: boolean }>({ key: "", phase: "idle", prepared: false });
  useEffect(() => {
    if (owner.current.key !== key) owner.current = { key };
    const lifecycle = owner.current;
    let phase: Phase = "idle";
    try { if (key && localStorage.getItem(key) === "installed") phase = "ready"; } catch { /* Registration remains available without storage. */ }
    setState({ key, phase, prepared: phase === "ready" });
    return () => { if (owner.current === lifecycle) owner.current = { key: "" }; };
  }, [key]);
  const install = async () => {
    if (!setup || busy.current === owner.current) return;
    const requestOwner = owner.current; busy.current = requestOwner;
    setState(current => ({ key, phase: "loading", prepared: current.key === key && current.prepared }));
    try {
      await prepareCodexInstallation(setup);
      // Keep this UI registration transition visible; no file or host installation is involved.
      await new Promise(resolve => setTimeout(resolve, 650));
      if (owner.current !== requestOwner) return;
      try { localStorage.setItem(key, "installed"); } catch { /* Session-only integration registration. */ }
      setState({ key, phase: "ready", prepared: true });
    } catch { if (owner.current === requestOwner) setState(current => ({ key, phase: "error", prepared: current.key === key && current.prepared })); }
    finally { if (busy.current === requestOwner) busy.current = null; }
  };
  return { phase: state.key === key ? state.phase : "idle", prepared: state.key === key && state.prepared, install };
}
