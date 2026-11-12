import { useEffect, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../../auth/presentation/session/TmsSessionContext";
import { importCodexConnection, loadImportCodexConnection, type ImportCodexSnapshot, type ImportCodexState } from "./import-codex-connection";

const unresolved = (status: "checking" | "unknown"): ImportCodexState => ({ status, pluginUrl: null,
  canConnect: false, canUpload: false, canExport: false });

export function useImportCodexConnection(workspaceId: string, projectId: string, canManage: boolean): ImportCodexState {
  const http = useOptionalTmsHttpClient();
  const subject = useOptionalTmsSession()?.subject;
  const key = JSON.stringify([subject, workspaceId, projectId]);
  const [result, setResult] = useState<{ key: string; snapshot: ImportCodexSnapshot | null } | null>(null);
  useEffect(() => {
    if (!http || !subject || !workspaceId || !projectId) return;
    let active: AbortController | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    const load = () => {
      active?.abort(); clearTimeout(expiry);
      const request = new AbortController(); active = request;
      setResult(null);
      void loadImportCodexConnection(http, workspaceId, request.signal).then(snapshot => {
        if (request.signal.aborted) return;
        setResult({ key, snapshot });
        const now = Date.now();
        const next = Math.min(...snapshot.connections.filter(grant => !grant.revokedAt && grant.projectIds.includes(projectId))
          .map(grant => Date.parse(grant.expiresAt)).filter(value => value > now));
        if (Number.isFinite(next)) expiry = setTimeout(load, Math.min(next - now + 10, 2_147_483_647));
      }, () => { if (!request.signal.aborted) setResult({ key, snapshot: null }); });
    };
    load(); window.addEventListener("focus", load);
    return () => { active?.abort(); clearTimeout(expiry); window.removeEventListener("focus", load); };
  }, [http, subject, key, workspaceId, projectId]);
  if (!http || !subject || !workspaceId || !projectId) return unresolved("unknown");
  if (!result || result.key !== key) return unresolved("checking");
  return result.snapshot ? importCodexConnection(result.snapshot, projectId, canManage) : unresolved("unknown");
}
