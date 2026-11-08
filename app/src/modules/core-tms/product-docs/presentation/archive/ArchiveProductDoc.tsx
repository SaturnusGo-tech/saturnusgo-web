"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { ProductDocModal } from "../overlay/ProductDocModal";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocSelection } from "../../state/useProductDocSelection";
import { ReadState } from "../status/ReadState";
import shared from "../product-docs.module.css";
import styles from "./archive.module.css";

export function ArchiveProductDoc({ api, scope, node, copy, onArchived, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  node: ProductDocNode;
  copy: ProductDocsCopy;
  onArchived(): void;
  onClose(stale: boolean): void;
}) {
  const pending = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<{ stale: boolean }>();
  const draft = useProductDocSelection(api, scope, { docId: node.id }, true);
  const current = draft.status === "ready" && draft.data.canPublish && !draft.data.archivedAt ? draft.data : undefined;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function archive() {
    if (!current || pending.current || failure?.stale) return;
    pending.current = true;
    setBusy(true);
    setFailure(undefined);
    try {
      await api.setArchived(scope, current.id, true, { expectedDraftVersion: current.draftVersion });
      if (mounted.current) onArchived();
    } catch (error) {
      if (mounted.current) setFailure({ stale: productDocErrorCode(error) === "PRODUCT_DOC_STALE_DRAFT" });
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  function dismiss() {
    if (!pending.current) onClose(failure?.stale ?? false);
  }

  return <ProductDocModal title={copy.archiveItem} subtitle={current?.title ?? node.title} closeLabel={copy.close} busy={busy} onClose={dismiss}>
    <div className={styles.confirmation} aria-busy={busy || draft.status === "loading"}>
      {draft.status !== "ready" ? <ReadState copy={copy} status={draft.status} retry={draft.retry} />
        : current ? <p>{copy.archiveHint}</p> : <p role="alert">{copy.unavailable}</p>}
      {failure && <p role="alert" className={shared.error}>
        {failure.stale ? copy.lifecycleStale : copy.archiveError}
      </p>}
      <div className={styles.actions}>
        <Button autoFocus type="button" className={shared.action} isDisabled={busy} onPress={dismiss}>
          {copy.cancel}
        </Button>
        <Button type="button" className={shared.primary} isDisabled={!current || busy || failure?.stale} onPress={() => void archive()}>
          {busy ? copy.saving : copy.archiveItem}
        </Button>
      </div>
    </div>
  </ProductDocModal>;
}
