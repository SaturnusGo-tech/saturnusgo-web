import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { readFolderAppearanceCatalog } from "../../data/appearance/folder-catalog";
import type { RepositoryFolder } from "../../model/folder";

export function useFolderAppearanceCatalog(workspaceId: string, primary: readonly RepositoryFolder[], activeProjectId = primary[0]?.projectId) {
  const http = useTmsHttpClient(); const [remote, setRemote] = useState<readonly RepositoryFolder[]>([]);
  const cache = useRef(new Map<string, readonly RepositoryFolder[]>()), requests = useRef(new Map<string, Promise<void>>());
  const lifetime = useMemo(() => new AbortController(), [workspaceId]), latest = useRef(workspaceId), current = useRef(primary);
  const cacheScope = useRef(workspaceId);
  if (cacheScope.current !== workspaceId) { cacheScope.current = workspaceId; cache.current.clear(); requests.current.clear(); }
  latest.current = workspaceId; current.current = primary;
  const mounted = useRef(false), activeLifetime = useRef(lifetime); activeLifetime.current = lifetime;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; queueMicrotask(() => {
      if (!mounted.current || activeLifetime.current !== lifetime) lifetime.abort();
    }); };
  }, [lifetime]);
  useEffect(() => {
    const first = primary[0]; if (!first || first.workspaceId !== workspaceId) return;
    const key = JSON.stringify([workspaceId, first.projectId]);
    if (cache.current.get(key) === primary) return;
    cache.current.set(key, primary); setRemote([...cache.current.values()].flat());
  }, [primary, workspaceId]);
  const loadProjects = useCallback(async (projectIds: readonly string[], signal: AbortSignal) => {
    const projects = [...new Set(projectIds)].filter(Boolean).slice(0, 100); let index = 0;
    async function worker() {
      while (index < projects.length && !signal.aborted && !lifetime.signal.aborted && latest.current === workspaceId) {
        const projectId = projects[index++], key = JSON.stringify([workspaceId, projectId]);
        if (projectId === activeProjectId || cache.current.has(key) || current.current.some(folder => folder.workspaceId === workspaceId && folder.projectId === projectId)) continue;
        while (requests.current.has(key)) {
          await requests.current.get(key);
          if (signal.aborted || lifetime.signal.aborted || latest.current !== workspaceId) return;
        }
        if (cache.current.has(key)) continue;
        const controller = new AbortController(); const stop = () => controller.abort();
        signal.addEventListener("abort", stop, { once: true }); lifetime.signal.addEventListener("abort", stop, { once: true });
        if (signal.aborted || lifetime.signal.aborted) controller.abort();
        const request: Promise<void> = readFolderAppearanceCatalog(http, { workspaceId, projectId }, controller.signal).then(folders => {
          if (controller.signal.aborted || latest.current !== workspaceId) return;
          cache.current.set(key, folders); setRemote([...cache.current.values()].flat());
        }).catch(() => { /* Default artwork remains usable; a later visible scope retries the read. */ }).finally(() => {
          if (requests.current.get(key) === request) requests.current.delete(key);
          signal.removeEventListener("abort", stop); lifetime.signal.removeEventListener("abort", stop);
        });
        requests.current.set(key, request); await request;
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, projects.length) }, worker));
  }, [http, workspaceId, lifetime, activeProjectId]);
  const folders = useMemo(() => [...new Map([...remote.filter(folder => folder.workspaceId === workspaceId), ...primary]
    .map(folder => [JSON.stringify([folder.workspaceId, folder.projectId, folder.id]), folder])).values()], [remote, primary, workspaceId]);
  return { folders, loadProjects };
}
