import { useCallback, useEffect, useRef, useState } from "react";
import { TmsApiError } from "../../../../core/tms/transport/http";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import type { RepositoryFolder } from "../../folders/model/folder";
import { archiveSharedStep, createSharedStep, getSharedStep, listSharedSteps, reviseSharedStep } from "../data/shared-step-api";
import type { SharedStep, SharedStepDraft, SharedStepSummary } from "../model/shared-step";

type Connection = "loading" | "connected" | "error" | "demo";
type Folder = Pick<RepositoryFolder, "id" | "projectId" | "path" | "archivedAt">;

export function useSharedSteps(projectId: string, connection: Connection, folders?: readonly Folder[]) {
  const http = useTmsHttpClient();
  const [items, setItems] = useState<SharedStepSummary[]>([]);
  const [selected, setSelected] = useState<SharedStep | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [saving, setSaving] = useState(false);
  const scope = useRef({ projectId, connection, http, active: true });
  if (scope.current.projectId !== projectId || scope.current.connection !== connection || scope.current.http !== http) {
    scope.current = { projectId, connection, http, active: true };
  }
  const owner = scope.current;
  const live = () => owner.active && scope.current === owner;
  const cache = useRef(new Map<string, SharedStep>());
  const requests = useRef(new Set<AbortController>());
  const epoch = useRef({ list: 0, selection: 0, status: 0, save: 0, reads: new Map<string, number>() });
  const saveOwner = useRef<typeof owner | null>(null);
  const catalog = useRef(folders); catalog.current = folders;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!live() || signal?.aborted) return;
    const request = ++epoch.current.list, statusRequest = ++epoch.current.status;
    if (!projectId) { setItems([]); setStatus("ready"); return; }
    if (connection === "demo") { setStatus("ready"); return; }
    if (connection !== "connected") return;
    setStatus("loading");
    try {
      const values = await listSharedSteps(http, projectId, signal);
      if (!live() || signal?.aborted || request !== epoch.current.list) return;
      setItems(values);
      if (statusRequest === epoch.current.status) setStatus("ready");
    } catch {
      if (live() && !signal?.aborted && request === epoch.current.list && statusRequest === epoch.current.status) setStatus("error");
    }
  }, [owner]);

  useEffect(() => {
    owner.active = true;
    setItems([]); setSelected(null); setSaving(false); cache.current.clear();
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => {
      owner.active = false; controller.abort();
      requests.current.forEach(request => request.abort()); requests.current.clear();
    };
  }, [projectId, connection, http]);

  const read = useCallback(async (id: string, fresh = false, accept: () => boolean = () => true) => {
    if (!live()) return null;
    const cached = cache.current.get(id);
    if (!fresh && cached) return cached;
    if (connection !== "connected" || !projectId) return null;
    const request = (epoch.current.reads.get(id) ?? 0) + 1;
    epoch.current.reads.set(id, request);
    const controller = new AbortController(); requests.current.add(controller);
    try {
      const value = await getSharedStep(http, projectId, id, controller.signal);
      if (!live() || !accept() || epoch.current.reads.get(id) !== request) return null;
      cache.current.set(id, value);
      return value;
    } finally { requests.current.delete(controller); }
  }, [owner]);
  const resolve = useCallback((id: string) => read(id), [read]);

  const open = useCallback(async (id: string) => {
    if (!live()) return null;
    const request = ++epoch.current.selection, statusRequest = ++epoch.current.status;
    const accept = () => request === epoch.current.selection;
    setStatus("loading");
    try {
      const value = await read(id, false, accept);
      if (!live() || !accept()) return null;
      if (value) setSelected(value);
      if (statusRequest === epoch.current.status) setStatus("ready");
      return value;
    } catch {
      if (live() && accept() && statusRequest === epoch.current.status) setStatus("error");
      return null;
    }
  }, [owner, read]);

  const save = useCallback(async (draft: SharedStepDraft, current?: SharedStep | null, operationKey?: string) => {
    if (!live() || !projectId || saveOwner.current === owner || (connection !== "demo" && connection !== "connected")) return null;
    if (current && current.projectId !== projectId) return null;
    const request = ++epoch.current.save, selectionRequest = ++epoch.current.selection;
    saveOwner.current = owner; setSaving(true);
    try {
      let saved: SharedStep;
      if (connection === "demo") {
        const folderId = draft.folderId === undefined ? current?.folderId ?? null : draft.folderId;
        const folder = catalog.current?.find(value => value.id === folderId && value.projectId === projectId && !value.archivedAt);
        let folderPath = "/";
        if (folderId) {
          if (folder) folderPath = folder.path;
          else if (catalog.current === undefined && current?.folderId === folderId) folderPath = current.folderPath;
          else throw new Error("Selected folder is unavailable.");
        }
        const now = new Date().toISOString(), id = current?.id ?? `shared-step-${crypto.randomUUID()}`;
        const revision = (current?.currentRevision ?? 0) + 1;
        saved = { id, projectId, folderId, folderPath,
          currentRevision: revision, current: { revision, title: draft.title, items: draft.items,
            changeNote: draft.changeNote, createdBy: "demo-user", createdAt: now },
          revisionCount: (current?.revisionCount ?? 0) + 1, archivedAt: null,
          createdAt: current?.createdAt ?? now, updatedAt: now, etag: `"shared-step:${id}:v${revision}"` };
      } else saved = current ? await reviseSharedStep(http, current, draft, operationKey)
        : await createSharedStep(http, projectId, draft, operationKey);
      if (!live() || request !== epoch.current.save) return null;
      epoch.current.list++;
      epoch.current.reads.set(saved.id, (epoch.current.reads.get(saved.id) ?? 0) + 1);
      cache.current.set(saved.id, saved);
      if (selectionRequest === epoch.current.selection) setSelected(saved);
      if (connection === "demo") setItems(values => [{ id: saved.id, projectId, folderId: saved.folderId,
        folderPath: saved.folderPath, currentRevision: saved.currentRevision, title: saved.current.title,
        itemCount: saved.current.items.length, usageCount: values.find(value => value.id === saved.id)?.usageCount ?? 0,
        revisionCount: saved.revisionCount, archivedAt: null, createdAt: saved.createdAt,
        updatedAt: saved.updatedAt, etag: saved.etag }, ...values.filter(value => value.id !== saved.id)]);
      else await refresh();
      return saved;
    } finally {
      if (saveOwner.current === owner) saveOwner.current = null;
      if (live() && request === epoch.current.save) setSaving(false);
    }
  }, [owner, refresh]);

  const reload = useCallback(async (id: string) => {
    if (!live()) throw new DOMException("Shared-step scope changed", "AbortError");
    const request = ++epoch.current.selection;
    const value = await read(id, true, () => request === epoch.current.selection);
    if (!value || !live() || request !== epoch.current.selection) throw new DOMException("Shared-step read superseded", "AbortError");
    setSelected(value);
    return value;
  }, [owner, read]);

  const archive = useCallback(async (item: SharedStepSummary, operationKey: string, signal?: AbortSignal) => {
    try {
      if (!live() || connection !== "connected" || item.projectId !== projectId || signal?.aborted) return "failed" as const;
      const statusRequest = epoch.current.status;
      const archived = await archiveSharedStep(http, item, operationKey, signal);
      if (!live() || signal?.aborted) return "failed" as const;
      epoch.current.list++;
      epoch.current.reads.set(archived.id, (epoch.current.reads.get(archived.id) ?? 0) + 1);
      if (statusRequest === epoch.current.status) { epoch.current.status++; setStatus("ready"); }
      cache.current.set(archived.id, archived);
      setItems(values => values.filter(value => value.id !== archived.id));
      setSelected(value => value?.id === archived.id ? null : value);
      return "success" as const;
    } catch (error) {
      if (!live() || signal?.aborted) return "failed" as const;
      if (error instanceof TmsApiError && error.status === 412) { await refresh(signal); return "changed" as const; }
      if (error instanceof TmsApiError && error.status === 403) return "forbidden" as const;
      return "failed" as const;
    }
  }, [owner, refresh]);

  const close = useCallback(() => {
    if (!live()) return;
    epoch.current.selection++; epoch.current.status++;
    setSelected(null); setStatus("ready");
  }, [owner]);
  return { items, selected, status, saving, open, resolve, save, refresh, reload, archive, close, setSelected,
    attachmentsEnabled: connection === "connected", archiveEnabled: connection === "connected" };
}
