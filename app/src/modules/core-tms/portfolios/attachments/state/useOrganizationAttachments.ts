import { useEffect, useRef, useState } from "react";
import { useTmsHttpClient } from "../../../auth/http/TmsHttpClientContext";
import { useAttachmentClient } from "../../../attachments/presentation/context/AttachmentClientProvider";
import type { AttachmentMetadata } from "../../../attachments/domain/attachment";
import { uploadEvidence } from "../../../application/evidence/uploadEvidence";
import { toTmsMutationFailure, type TmsMutationFailure } from "../../../../../core/tms/errors/mutation-failure";
import { useCatalogPage } from "../../state/catalog/useCatalogPage";
import type { OrganizationTarget } from "../../management/model/organization";
import { mergeOrganizationAttachments } from "../application/merge-attachments";
import { listOrganizationAttachments } from "../data/organization-attachments";
type Upload = { id: string; file: File; phase: "pending" | "failed"; error: TmsMutationFailure | null };
export function useOrganizationAttachments(target: OrganizationTarget, canRead: boolean, canManage: boolean) {
  const http = useTmsHttpClient();
  const client = useAttachmentClient();
  const scope = `${target.workspaceId}:${target.targetType}:${target.targetId}`;
  const latest = useRef(scope); latest.current = scope;
  const permission = useRef(canManage); permission.current = canManage;
  const active = useRef<AbortController | null>(null);
  const [recordedScope, setRecordedScope] = useState(scope);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [confirmed, setConfirmed] = useState<AttachmentMetadata[]>([]);
  const [pending, setPending] = useState(false);
  const list = useCatalogPage(scope, canRead, (cursor, signal) => listOrganizationAttachments(http, target, cursor, signal));
  useEffect(() => {
    const observed = new Set(list.items.map((item) => item.id));
    setConfirmed((current) => current.some((item) => observed.has(item.id)) ? current.filter((item) => !observed.has(item.id)) : current);
  }, [list.items]);
  useEffect(() => { setRecordedScope(scope); setUploads([]); setConfirmed([]); setPending(false); return () => active.current?.abort(); }, [scope]);
  useEffect(() => { if (!canManage) { active.current?.abort(); setUploads([]); setPending(false); } }, [canManage]);
  async function run(entries: Upload[]) {
    if (!canManage || active.current && !active.current.signal.aborted) return;
    const controller = new AbortController(); active.current = controller;
    setPending(true);
    for (const entry of entries) {
      if (controller.signal.aborted || latest.current !== scope || !permission.current) break;
      setUploads((current) => current.map((item) => item.id === entry.id ? { ...item, phase: "pending", error: null } : item));
      try {
        const owner = target.targetType === "portfolio" ? { portfolioId: target.targetId, owner: { kind: "portfolio" as const, portfolioId: target.targetId } }
          : { projectId: target.targetId, owner: { kind: "project" as const, projectId: target.targetId } };
        const [metadata] = await uploadEvidence({ ...owner, client, files: [entry.file], operationKeyPrefix: entry.id, signal: controller.signal });
        if (controller.signal.aborted || latest.current !== scope) break;
        setConfirmed((current) => [...current, metadata]);
        setUploads((current) => current.filter((item) => item.id !== entry.id));
        list.reload();
      } catch (error) {
        if (controller.signal.aborted || latest.current !== scope) break;
        setUploads((current) => current.map((item) => item.id === entry.id ? { ...item, phase: "failed", error: toTmsMutationFailure(error) } : item));
      }
    }
    if (latest.current === scope) setPending(false);
    controller.abort();
  }
  function add(files: File[]) {
    if (!canManage || pending || active.current && !active.current.signal.aborted || files.length > 20) return;
    const entries: Upload[] = files.map((file) => ({ id: crypto.randomUUID(), file, phase: "pending", error: null }));
    setUploads((current) => [...current, ...entries]); void run(entries);
  }
  const merged = mergeOrganizationAttachments(recordedScope === scope ? confirmed : [], list.items);
  return { ...list, items: merged, uploads: recordedScope === scope ? uploads : [], pending: recordedScope === scope && pending, add,
    retry: (entry: Upload) => void run([entry]),
    discard: (id: string) => { if (!pending) setUploads((current) => current.filter((item) => item.id !== id)); } };
}
