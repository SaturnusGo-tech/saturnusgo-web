"use client";
import { Button } from "@heroui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorToast } from "../../../../presentation/common/error/ErrorToast";
import type { ProductDocNode } from "../../../domain/product-docs";
import type { ProductDocLifecycleMode } from "../../../domain/lifecycle/product-doc-lifecycle";
import type { ProductDocLifecycleContext } from "../../../state/lifecycle/product-doc-lifecycle-context";
import { productDocErrorCode } from "../../../domain/errors/product-doc-response";
import { productDocDraftKey } from "../../../state/draft/draft-buffer";
import { useProductDocResource } from "../../../state/useProductDocResource";
import { ProductDocModal } from "../../overlay/ProductDocModal";
import { ReadState } from "../../status/ReadState";
import shared from "../../product-docs.module.css";
import styles from "./lifecycle-dialog.module.css";

export function ProductDocLifecycleDialog({ context, node, mode, canEdit, onClose }: {
  context: ProductDocLifecycleContext; node: ProductDocNode; mode: ProductDocLifecycleMode;
  canEdit: boolean; onClose(stale: boolean): void;
}) {
  const { api, scope, copy, drafts } = context;
  const pending = useRef(false), mounted = useRef(false), request = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ stale: boolean; forbidden: boolean }>();
  const owner = useMemo<{ deleteKey?: string; blocked?: boolean; complete?: boolean }>(() => ({}),
    [api, context.ownerId, scope.workspaceId, scope.projectId, node.id, mode]);
  const activeOwner = useRef(owner); activeOwner.current = owner;
  const read = useMemo(() => (signal: AbortSignal) => api.get(scope, node.id, {
    draft: node.archivedAt ? undefined : canEdit && node.publishedVersion === null,
    archived: node.archivedAt ? true : undefined, signal,
  }), [api, scope, node.id, node.publishedVersion, node.archivedAt, canEdit, owner]);
  const resource = useProductDocResource(read);
  const current = resource.status === "ready" && resource.data.id === node.id
    && Number.isSafeInteger(resource.data.lifecycleVersion) && resource.data.lifecycleVersion! > 0
    && (mode === "archive" ? resource.data.canArchive === true && !resource.data.archivedAt : resource.data.canDelete === true)
    ? resource.data : undefined;
  const label = mode === "archive" ? copy.archiveItem : copy.deleteItem;
  useEffect(() => {
    mounted.current = true;
    setFailure(undefined);
    return () => { mounted.current = false; request.current?.abort(); };
  }, [owner]);

  async function confirm() {
    if (!mounted.current || !current || activeOwner.current !== owner || pending.current || owner.blocked || owner.complete) return;
    pending.current = true;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setFailure(undefined);
    try {
      // The receipt confirms the root, not descendants that could have moved concurrently.
      const affected = drafts.has(productDocDraftKey(scope, current.id)) ? [current.id] : [];
      const input = { expectedDraftVersion: current.lifecycleVersion! };
      if (mode === "archive") await api.setArchived(scope, current.id, true, input);
      else {
        owner.deleteKey ??= crypto.randomUUID();
        await api.delete(scope, current.id, input, { idempotencyKey: owner.deleteKey });
      }
      owner.complete = true;
      if (mounted.current && !controller.signal.aborted && activeOwner.current === owner) context.onCompleted(current, mode, affected);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted && activeOwner.current === owner) {
        const code = productDocErrorCode(error);
        const next = { stale: code === "PRODUCT_DOC_STALE_DRAFT", forbidden: code === "PRODUCT_DOC_ACCESS_DENIED" };
        owner.blocked = next.stale || next.forbidden;
        setFailure(next);
      }
    } finally {
      pending.current = false;
      if (mounted.current && activeOwner.current === owner) setBusy(false);
    }
  }
  function dismiss() { if (!pending.current) onClose(failure?.stale ?? false); }
  return <ProductDocModal title={label} subtitle={current?.title || node.title} closeLabel={copy.close}
    busy={busy} onClose={dismiss}>
    {dismissModal => <div className={styles.body} aria-busy={busy || resource.status === "loading"}>
      {resource.status !== "ready" ? <ReadState copy={copy} status={resource.status} retry={resource.retry} />
        : current ? <><p>{mode === "archive" ? copy.archiveHint : copy.deleteHint}</p><p>{copy.lifecycleUnsaved}</p></>
          : <p>{copy.lifecycleUnavailable}</p>}
      <ErrorToast message={failure ? failure.stale ? copy.lifecycleStale : failure.forbidden ? copy.lifecycleForbidden
        : mode === "archive" ? copy.archiveError : copy.deleteError : null} />
      <div className={styles.actions}>
        <Button autoFocus variant="light" radius="full" isDisabled={busy}
          onPress={() => { if (!pending.current) dismissModal(); }}>{copy.cancel}</Button>
        <Button className={mode === "delete" ? styles.danger : shared.primary} radius="full"
          isDisabled={!current || busy || failure?.stale || failure?.forbidden} onPress={() => void confirm()}>
          {busy ? copy.saving : label}
        </Button>
      </div>
    </div>}
  </ProductDocModal>;
}
