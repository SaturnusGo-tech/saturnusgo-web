import { useCallback, useEffect, useRef, useState } from "react";

import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import {
  createSharedStep, getSharedStep, listSharedSteps, reviseSharedStep,
} from "../data/shared-step-api";
import type { SharedStep, SharedStepDraft, SharedStepSummary } from "../model/shared-step";

type Connection = "loading" | "connected" | "error" | "demo";

export function useSharedSteps(projectId: string, connection: Connection) {
  const http = useTmsHttpClient();
  const [items, setItems] = useState<SharedStepSummary[]>([]);
  const [selected, setSelected] = useState<SharedStep | null>(null);
  const cache = useRef(new Map<string, SharedStep>());
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!projectId) { setItems([]); setStatus("ready"); return; }
    if (connection === "demo") { setStatus("ready"); return; }
    if (connection !== "connected") return;
    setStatus("loading");
    try { setItems(await listSharedSteps(http, projectId, signal)); setStatus("ready"); }
    catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("error"); }
  }, [connection, http, projectId]);

  useEffect(() => {
    setSelected(null);
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [refresh]);

  const resolve = useCallback(async (id: string) => {
    if (selected?.id === id) return selected;
    const cached = cache.current.get(id);
    if (cached) return cached;
    if (connection === "demo") return null;
    if (connection !== "connected" || !projectId) return null;
    const value = await getSharedStep(http, projectId, id);
    cache.current.set(id, value);
    return value;
  }, [connection, http, projectId, selected]);

  const open = useCallback(async (id: string) => {
    setStatus("loading");
    try {
      const value = await resolve(id);
      if (value) setSelected(value);
      setStatus("ready");
      return value;
    } catch { setStatus("error"); return null; }
  }, [resolve]);

  const save = useCallback(async (draft: SharedStepDraft, current?: SharedStep | null) => {
    if (!projectId) return null;
    setSaving(true);
    try {
      if (connection === "demo") {
        const now = new Date().toISOString();
        const local: SharedStep = { id: current?.id ?? `shared-step-${crypto.randomUUID()}`,
          projectId, currentRevision: (current?.currentRevision ?? 0) + 1,
          current: { revision: (current?.currentRevision ?? 0) + 1, title: draft.title,
            items: draft.items, changeNote: draft.changeNote, createdBy: "demo-user", createdAt: now },
          revisionCount: (current?.revisionCount ?? 0) + 1, archivedAt: null,
          createdAt: current?.createdAt ?? now, updatedAt: now,
          etag: `"shared-step:${current?.id ?? "demo"}:v${(current?.currentRevision ?? 0) + 1}"` };
        setSelected(local);
        cache.current.set(local.id, local);
        setItems((values) => [{ id: local.id, projectId, currentRevision: local.currentRevision,
          title: local.current.title, itemCount: local.current.items.length,
          usageCount: values.find(({ id }) => id === local.id)?.usageCount ?? 0,
          revisionCount: local.revisionCount, archivedAt: null, createdAt: local.createdAt,
          updatedAt: local.updatedAt, etag: local.etag }, ...values.filter(({ id }) => id !== local.id)]);
        return local;
      }
      const saved = current ? await reviseSharedStep(http, current, draft)
        : await createSharedStep(http, projectId, draft);
      setSelected(saved);
      cache.current.set(saved.id, saved);
      await refresh();
      return saved;
    } finally { setSaving(false); }
  }, [connection, http, projectId, refresh]);

  return { items, selected, status, saving, open, resolve, save, refresh,
    close: () => setSelected(null), setSelected };
}
