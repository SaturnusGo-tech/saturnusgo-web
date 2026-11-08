import { useEffect, useState } from "react";
import { useOptionalTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { useOptionalTmsSession } from "../../../../auth/presentation/session/TmsSessionContext";
import { createCodexEmployeeApi } from "../../../../codex-employee/data/http/codex-employee-api";
import { projectCodexStatus } from "./codexDocsLaunch";

type Status = "checking" | "unknown" | ReturnType<typeof projectCodexStatus>;

export function useProductDocCodexConnection(workspaceId: string, projectId: string) {
  const http = useOptionalTmsHttpClient();
  const subject = useOptionalTmsSession()?.subject;
  const key = JSON.stringify([subject, workspaceId, projectId]);
  const [result, setResult] = useState<{ key: string; status: Status } | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!http || !subject) return;
    const api = createCodexEmployeeApi(http);
    let active: AbortController | undefined;
    const load = () => {
      active?.abort();
      const request = new AbortController();
      active = request;
      setResult({ key, status: "checking" });
      void api.connections(request.signal, workspaceId).then((connections) => {
        if (!request.signal.aborted) setResult({ key, status: projectCodexStatus(connections, projectId) });
      }, () => {
        if (!request.signal.aborted) setResult({ key, status: "unknown" });
      });
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("focus", load);
      active?.abort();
    };
  }, [http, key, projectId, revision, subject, workspaceId]);
  const status: Status = !http || !subject ? "unknown" : result?.key === key ? result.status : "checking";
  return { status, refresh: () => setRevision((value) => value + 1) };
}
