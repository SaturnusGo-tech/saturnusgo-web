import { useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import type { useWorkspaceState } from "../../../state/workspace/useWorkspaceState";
import type { useWorkspaceDerived } from "../../../state/workspace-derived/useWorkspaceDerived";
import { archiveFolderCases, changeFolder, createFolder, moveFolderCases, transitionFolder } from "../../data/folder-api";
import type { FolderResource, RepositoryFolder } from "../../model/folder";
import { useFolderQuery } from "../query/useFolderQuery";

export function useWorkspaceFolders(state: ReturnType<typeof useWorkspaceState>, derived: ReturnType<typeof useWorkspaceDerived>): FolderResource {
  const http = useTmsHttpClient();
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const scope = { workspaceId: state.data.workspace.id, projectId: derived.project?.id ?? "" };
  const connected = state.connection === "connected";
  const canManage = connected && state.data.meta.authorization.capabilities.includes("test_case:manage");
  const query = useFolderQuery(http, scope, connected && Boolean(scope.projectId));
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const pending = useRef<{ signature: string; key: string } | null>(null);
  const scopeKey = JSON.stringify([scope.workspaceId, scope.projectId, state.view, connected]);
  const latest = useRef(scopeKey);
  latest.current = scopeKey;
  const mounted = useRef(false);
  const [mutationError, setMutationError] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setMutationError(""); }, [scopeKey]);

  function captureCurrent() {
    const navigationCurrent = state.captureProjectNavigationGuard();
    return () => mounted.current && latest.current === scopeKey && navigationCurrent();
  }
  async function refresh(isCurrent: () => boolean) {
    if (!isCurrent()) return null;
    query.reload();
    return state.refreshProject(scope.projectId);
  }
  async function reload() {
    if (active.current || !connected || !scope.projectId) return;
    const isCurrent = captureCurrent();
    if (!isCurrent()) return;
    active.current = true; setBusy(true);
    try {
      const refreshed = await refresh(isCurrent);
      if (isCurrent()) setMutationError(refreshed ? "" : (ru ? "Не удалось обновить кейсы. Повторите обновление." : "Could not refresh cases. Retry the refresh."));
    } finally { active.current = false; if (mounted.current) setBusy(false); }
  }
  async function command<T>(signature: string, execute: (key: string) => Promise<T>): Promise<T | null> {
    if (active.current || !canManage) return null;
    const isCurrent = captureCurrent();
    if (!isCurrent()) return null;
    active.current = true; setBusy(true); setMutationError("");
    const fingerprint = `${scope.workspaceId}:${scope.projectId}:${signature}`;
    if (pending.current?.signature !== fingerprint) pending.current = { signature: fingerprint, key: crypto.randomUUID() };
    try {
      const result = await execute(pending.current.key);
      pending.current = null;
      if (!isCurrent()) return null;
      const refreshed = await refresh(isCurrent);
      if (!isCurrent()) return null;
      if (!refreshed) setMutationError(ru ? "Изменения сохранены. Обновите список кейсов." : "Changes saved. Refresh the case list.");
      return result;
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : (ru ? "Не удалось сохранить изменения." : "Could not save changes.");
      if (failure instanceof TmsApiError && failure.status === 412) {
        pending.current = null;
        if (isCurrent()) {
          setMutationError(message);
          const refreshed = await refresh(isCurrent);
          if (isCurrent() && !refreshed) setMutationError(`${message} ${ru ? "Обновите список кейсов." : "Refresh the case list."}`);
        }
      } else if (isCurrent()) { setMutationError(message); query.reload(); }
      return null;
    } finally { active.current = false; if (mounted.current) setBusy(false); }
  }
  function targets(ids: readonly string[]) {
    const unique = [...new Set(ids)];
    if (!unique.length || unique.length > 1000) throw new Error(ru ? "Выберите от 1 до 1000 кейсов." : "Select between 1 and 1000 cases.");
    return unique.map((id) => {
      const item = derived.projectCases.find((testCase) => testCase.id === id && !testCase.archivedAt);
      if (!item?.etag) throw new Error(ru ? "Обновите список перед переносом." : "Refresh cases before moving them.");
      return { id, ifMatch: item.etag };
    });
  }
  async function bulk(ids: readonly string[], targetFolderId?: string | null) {
    try {
      const items = targets(ids);
      const request = { items, ...(targetFolderId === undefined ? {} : { targetFolderId }) };
      const result = await command(JSON.stringify(request), (key) => targetFolderId === undefined
        ? archiveFolderCases(http, scope, { items }, key)
        : moveFolderCases(http, scope, { items, targetFolderId }, key));
      return result ? { ok: true as const } : { ok: false as const, message: ru ? "Изменения не подтверждены. Обновите список и повторите." : "Changes were not confirmed. Refresh and retry." };
    } catch (failure) { return { ok: false as const, message: failure instanceof Error ? failure.message : "Invalid selection." }; }
  }
  async function transition(folder: RepositoryFolder, operation: "archive" | "restore") {
    return Boolean(await command(`${operation}:${folder.id}:${folder.etag}`, (key) => transitionFolder(http, scope, folder, operation, key)));
  }
  return {
    ...query, reload, error: mutationError || query.error, busy, canManage,
    async create(name, parentId) {
      const result = await command(`create:${parentId}:${name}`, (key) => createFolder(http, scope, { name, parentId }, key));
      return result?.data ?? null;
    },
    async update(folder, patch) {
      const result = await command(`update:${folder.id}:${folder.etag}:${JSON.stringify(patch)}`, (key) => changeFolder(http, scope, folder, patch, key));
      if (result && latest.current === scopeKey && (state.selectedFolder === folder.path || state.selectedFolder.startsWith(`${folder.path}/`))) {
        state.setSelectedFolder(result.data.path + state.selectedFolder.slice(folder.path.length));
      }
      return Boolean(result);
    },
    archive: (folder) => transition(folder, "archive"), restore: (folder) => transition(folder, "restore"),
    moveCases: (ids, targetFolderId) => bulk(ids, targetFolderId), archiveCases: (ids) => bulk(ids),
  };
}
