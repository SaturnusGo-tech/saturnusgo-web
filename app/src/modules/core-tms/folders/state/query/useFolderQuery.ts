import { useCallback, useEffect, useRef, useState } from "react";
import type { TmsHttpClient } from "../../../../../core/tms/transport/http";
import { listFolders } from "../../data/folder-api";
import type { FolderScope, RepositoryFolder } from "../../model/folder";

export function useFolderQuery(http: TmsHttpClient, scope: FolderScope, enabled: boolean) {
  const [items, setItems] = useState<readonly RepositoryFolder[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const abort = useRef<AbortController | null>(null);
  const reload = useCallback(() => setGeneration((value) => value + 1), []);
  const scopeKey = `${scope.workspaceId}:${scope.projectId}`;
  const loaded = useRef("");
  useEffect(() => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    if (!enabled || !scope.projectId) { setItems([]); setLoading(false); setError(""); return; }
    if (loaded.current !== scopeKey) setItems([]);
    setLoading(true); setError("");
    listFolders(http, scope, controller.signal).then((next) => {
      if (controller.signal.aborted) return;
      loaded.current = scopeKey; setItems(next);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Unable to load folders.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [http, scopeKey, enabled, generation]);
  return { items: loaded.current === scopeKey ? items : [], loading: enabled && !error && (loaded.current !== scopeKey || loading), error, reload };
}
