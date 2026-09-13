import { useEffect, useState } from "react";
import type { Project } from "../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { usePortfolioCommand } from "../../state/command/usePortfolioCommand";
import type { CatalogAction } from "../model/action";
import { executeCatalogAction } from "../application/execute-catalog-action";

export function useCatalogActions(scope: string, enabled: boolean, refresh: () => void,
  updated: (project: Project, etag: string | null) => void, changed?: () => void) {
  const http = useTmsHttpClient();
  const [target, setTarget] = useState<CatalogAction | null>(null);
  const command = usePortfolioCommand(`${scope}:${target?.kind}:${target?.item.id}:${target?.action}`);
  useEffect(() => setTarget(null), [scope]);
  async function confirm() {
    if (!target || !enabled) return;
    const result = await command.run(JSON.stringify(target), (key, signal) => executeCatalogAction(http, target, key, signal));
    if (!result) return;
    if (result.kind === "project") updated(result.data, result.etag);
    setTarget(null); refresh(); changed?.();
  }
  return { target, ...command, open: (action: CatalogAction) => { if (enabled) setTarget(action); },
    close: () => { if (!command.pending) setTarget(null); }, confirm };
}
