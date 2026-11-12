import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { exportProjectCases } from "../../application/export-project-cases";
import { loadImportContext } from "../../data/context/import-context";

type ExportRequest = { controller: AbortController; scope: string; http: ReturnType<typeof useTmsHttpClient> };

export function useExportCases(project: Project, enabled = true) {
  const http = useTmsHttpClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<number | null>(null);
  const scope = JSON.stringify([project.id, project.key, project.name, enabled]);
  const current = useRef({ scope, http, enabled });
  current.current = { scope, http, enabled };
  const active = useRef<ExportRequest | null>(null);
  useEffect(() => {
    active.current?.controller.abort(); active.current = null;
    setBusy(false); setError(""); setCompleted(null);
    return () => { active.current?.controller.abort(); active.current = null; };
  }, [scope, http]);

  function cancel() {
    active.current?.controller.abort(); active.current = null;
    setBusy(false); setError("");
  }
  function isCurrent(request: ExportRequest) {
    return active.current === request && !request.controller.signal.aborted && current.current.enabled &&
      current.current.scope === request.scope && current.current.http === request.http;
  }
  async function start() {
    if (active.current || !current.current.enabled || current.current.scope !== scope || current.current.http !== http) return;
    const request = { controller: new AbortController(), scope, http };
    active.current = request;
    const { signal } = request.controller;
    setBusy(true); setError(""); setCompleted(null);
    try {
      const context = await loadImportContext(http, project.id, signal);
      if (!isCurrent(request)) return;
      const document = await exportProjectCases(http, project, signal, context.folders
        .filter((folder) => !folder.archivedAt).map((folder) => folder.path));
      if (!isCurrent(request)) return;
      const url = URL.createObjectURL(new Blob([`${JSON.stringify(document, null, 2)}\n`], { type: "application/json" }));
      try {
        const anchor = window.document.createElement("a");
        anchor.href = url; anchor.download = `${project.key.toLowerCase()}-test-cases.json`;
        anchor.click(); setCompleted(document.testCases.length);
      } finally { URL.revokeObjectURL(url); }
    } catch (failure) {
      if (isCurrent(request)) setError(failure instanceof Error ? failure.message : "Export failed.");
    } finally {
      if (isCurrent(request)) { active.current = null; setBusy(false); }
    }
  }
  return { busy, error, completed, start, cancel };
}
