import { useEffect, useState } from "react";
import type { Defect } from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import { getDefect } from "../../defects/data/defect-api";

export function useSelectedDefectResource(
  connected: boolean,
  projectId: string,
  defects: Defect[],
  defectId: string | null,
  includeArchived = false,
) {
  const http = useTmsHttpClient();
  const scope = JSON.stringify([projectId, defectId, includeArchived]);
  const cached = includeArchived ? null : defects.find((defect) => (
    defect.id === defectId && defect.projectId === projectId
  )) ?? null;
  const [resource, setResource] = useState<{
    scope: string; status: "loading" | "ready" | "error"; data: Defect | null;
  }>({ scope: "", status: "loading", data: null });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setResource({ scope, status: "loading", data: null });
    if (!defectId || cached) return;
    if (!connected) {
      if (includeArchived) setResource({ scope, status: "error", data: null });
      return;
    }
    const controller = new AbortController();
    getDefect(http, defectId, controller.signal, includeArchived).then((resource) => {
      if (!controller.signal.aborted) {
        setResource(resource.data.projectId === projectId
          ? { scope, status: "ready", data: resource.data }
          : { scope, status: "error", data: null });
      }
    }).catch(() => {
      if (!controller.signal.aborted) {
        setResource({ scope, status: "error", data: null });
      }
    });
    return () => controller.abort();
  }, [cached, connected, defectId, http, includeArchived, projectId, retry, scope]);

  if (cached) return { data: cached, status: "ready" as const, retry: () => {} };
  if (!defectId) return { data: null, status: "idle" as const, retry: () => {} };
  const visible = resource.scope === scope ? resource : {
    scope, status: "loading" as const, data: null,
  };
  return { ...visible, retry: () => setRetry((value) => value + 1) };
}
