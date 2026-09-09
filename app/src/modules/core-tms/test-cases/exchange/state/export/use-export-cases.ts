import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../../../auth/http/TmsHttpClientContext";
import { exportProjectCases } from "../../application/export-project-cases";
import { loadImportContext } from "../../data/context/import-context";

export function useExportCases(project: Project) {
  const http = useTmsHttpClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), [project.id]);
  async function start() {
    if (busy) return;
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(""); setCompleted(null);
    try {
      const context = await loadImportContext(http, project.id, controller.signal);
      const document = await exportProjectCases(http, project, controller.signal, context.folders
        .filter((folder) => !folder.archivedAt).map((folder) => folder.path));
      controller.signal.throwIfAborted();
      const url = URL.createObjectURL(new Blob([`${JSON.stringify(document, null, 2)}\n`], { type: "application/json" }));
      const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = `${project.key.toLowerCase()}-test-cases.json`;
      anchor.click(); URL.revokeObjectURL(url); setCompleted(document.testCases.length);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Export failed.");
    } finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return { busy, error, completed, start };
}
