"use client";

import { Folder, FolderInput } from "lucide-react";
import { useState } from "react";
import type { ProductDocDetail, ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocSelection } from "../../state/useProductDocSelection";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ReadState } from "../status/ReadState";
import styles from "../product-docs.module.css";

export function MoveProductDoc(props: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  onMoved(): void;
}) {
  const [open, setOpen] = useState(false);
  return <div className={styles.toolbarControl}>
    <button className={styles.iconButton} type="button" title={props.copy.move} aria-label={props.copy.move}
      aria-expanded={open} onClick={() => setOpen(!open)}><FolderInput size={17} aria-hidden="true" /></button>
    {open && <MoveChooser {...props} onClose={() => setOpen(false)} />}
  </div>;
}

function MoveChooser({ api, scope, document, copy, onMoved, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocDetail;
  copy: ProductDocsCopy;
  onMoved(): void;
  onClose(): void;
}) {
  const [path, setPath] = useState<ProductDocNode[]>([]);
  const parentId = path[path.length - 1]?.id ?? null;
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const resource = useProductDocList(api, scope, { parentId, refresh: 0, draft: true });
  const draft = useProductDocSelection(api, scope, { docId: document.id }, true);
  const current = draft.status === "ready" ? draft.data : undefined;

  async function move() {
    if (!current) return;
    setSaving(true);
    setFailed(false);
    try {
      await api.move(scope, document.id, { parentId, expectedDraftVersion: current.draftVersion });
      onMoved();
      onClose();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return <div className={styles.toolbarPopover} onKeyDown={(event) => {
    if (event.key === "Escape" && !saving) { event.stopPropagation(); onClose(); }
  }}>
    <strong>{copy.chooseDestination}</strong>
    <nav className={styles.moveTrail} aria-label={copy.chooseDestination}>
      <button type="button" onClick={() => setPath([])} disabled={saving}>{copy.projectRoot}</button>
      {path.map((node, index) => <button type="button" key={node.id} disabled={saving}
        onClick={() => setPath(path.slice(0, index + 1))}>{node.title}</button>)}
    </nav>
    <div className={styles.moveTargets}>
      {resource.error || (resource.loading && !resource.data) ? <ReadState copy={copy}
        status={resource.error ? "error" : "loading"} retry={resource.retry} />
        : resource.data?.nodes.filter((node) => node.id !== document.id).map((node) =>
          <button type="button" className={styles.menuItem} key={node.id} disabled={saving}
            onClick={() => setPath([...path, node])}><Folder size={15} aria-hidden="true" /> {node.title}</button>)}
      {resource.data?.nextCursor && <button type="button" className={styles.action}
        disabled={saving || resource.loading} onClick={resource.more}>{copy.more}</button>}
    </div>
    {draft.status === "error" && <ReadState copy={copy} status="error" retry={draft.retry} />}
    {failed && <p className={styles.error} role="alert">{copy.saveError}</p>}
    <div className={styles.formActions}>
      <button type="button" className={styles.action} disabled={saving} onClick={onClose}>{copy.cancel}</button>
      <button type="button" className={styles.primary} disabled={saving || !current || parentId === current.parentId} onClick={move}>
        {saving ? copy.saving : copy.moveHere}
      </button>
    </div>
  </div>;
}
