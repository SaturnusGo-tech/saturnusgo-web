"use client";

import { LayoutGrid } from "lucide-react";
import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Modal } from "../../../presentation/common/modal/Modal";
import { AppOverlay } from "../../../presentation/common/overlay/AppOverlay";
import { FolderChoiceRow } from "../../../presentation/dialogs/folder/parent/choice/FolderChoiceRow";
import folderStyles from "../../../presentation/dialogs/folder/parent/parent-folder-picker.module.css";
import { productDocErrorCode } from "../../domain/errors/product-doc-response";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import { useProductDocSelection } from "../../state/useProductDocSelection";
import { useProductDocList } from "../../state/tree/useProductDocList";
import { ReadState } from "../status/ReadState";
import { ProductDocSectionIcon } from "../tree/appearance/ProductDocSectionIcon";
import shared from "../product-docs.module.css";
import styles from "./move-product-doc.module.css";

export function MoveProductDoc({ api, scope, document: page, path, copy, onMoved, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  document: ProductDocNode;
  path?: readonly ProductDocNode[];
  copy: ProductDocsCopy;
  onMoved(): void;
  onClose(): void;
}) {
  const [destination, setDestination] = useState(page.parentId);
  const [open, setOpen] = useState(() => new Set(path?.map((node) => node.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const draft = useProductDocSelection(api, scope, { docId: page.id }, true);
  const current = draft.status === "ready" ? draft.data : undefined;

  function choose(parentId: string | null) {
    setDestination(parentId);
    setError("");
  }

  function toggle(id: string) {
    setOpen((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function move(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current || !current?.canEdit || destination === current.parentId) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      await api.move(scope, page.id, { parentId: destination, expectedDraftVersion: current.draftVersion });
      onMoved();
      onClose();
    } catch (failure) {
      setError(productDocErrorCode(failure) === "PRODUCT_DOC_PARENT_UNPUBLISHED" ? copy.unpublishedParent : copy.moveError);
      draft.retry();
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <AppOverlay><Modal title={copy.move} subtitle={page.title} panelClassName={styles.modal}
    onClose={() => { if (!pending.current) onClose(); }}>
    <form className={styles.form} onSubmit={(event) => void move(event)} aria-busy={saving}>
      <h3>{copy.chooseDestination}</h3>
      <div className={folderStyles.browser} data-inline>
        <div className={folderStyles.list} role="listbox" aria-label={copy.chooseDestination} tabIndex={0} data-autofocus
          onKeyDown={movePickerKeys}>
          <FolderChoiceRow name={copy.projectRoot} icon={<LayoutGrid size={17} aria-hidden="true" />} depth={0}
            selected={destination === null} tabIndex={destination === null ? 0 : -1} disabled={saving}
            onChoose={() => choose(null)} />
          <MoveBranch api={api} scope={scope} copy={copy} parentId={null} sourceId={page.id} destination={destination}
            open={open} depth={0} saving={saving} onToggle={toggle} onChoose={choose} />
        </div>
      </div>
      {draft.status === "error" && <ReadState copy={copy} status="error" retry={draft.retry} />}
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <footer className={styles.footer}>
        <button type="button" className={shared.action} disabled={saving} onClick={onClose}>{copy.cancel}</button>
        <button type="submit" className={shared.primary}
          disabled={saving || !current?.canEdit || destination === current.parentId}>
          {saving ? copy.saving : copy.moveHere}
        </button>
      </footer>
    </form>
  </Modal></AppOverlay>;
}

type BranchProps = {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  parentId: string | null;
  sourceId: string;
  destination: string | null;
  open: ReadonlySet<string>;
  depth: number;
  saving: boolean;
  onToggle(id: string): void;
  onChoose(id: string): void;
};

function MoveBranch(props: BranchProps) {
  const { api, scope, copy, parentId, sourceId, destination, open, depth, saving, onToggle, onChoose } = props;
  const resource = useProductDocList(api, scope, { parentId, refresh: 0, draft: true });
  if (!resource.data || (resource.error && !resource.data.nodes.length)) {
    return <ReadState copy={copy} status={resource.error ? "error" : "loading"} retry={resource.retry} />;
  }
  return <>
    {resource.data.nodes.filter((node) => node.id !== sourceId).map((node) => {
      const expanded = open.has(node.id);
      const selected = destination === node.id;
      return <div key={node.id}>
        <FolderChoiceRow name={node.title} icon={<ProductDocSectionIcon scope={scope} node={node} size={17} />}
          depth={depth} selected={selected} tabIndex={selected ? 0 : -1} disabled={saving} expanded={expanded}
          onToggle={() => onToggle(node.id)} onChoose={() => onChoose(node.id)} />
        {expanded && <MoveBranch {...props} parentId={node.id} depth={depth + 1} />}
      </div>;
    })}
    {resource.error
      ? <button type="button" className={styles.branchButton} onClick={resource.retry}>{copy.retry}</button>
      : resource.data.nextCursor && <button type="button" className={styles.branchButton}
        disabled={saving || resource.loading} onClick={resource.more}>{copy.more}</button>}
  </>;
}

function movePickerKeys(event: KeyboardEvent<HTMLDivElement>) {
  const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="option"]:not([disabled])'));
  const focused = event.target as HTMLButtonElement;
  const index = options.indexOf(focused);
  let next: HTMLButtonElement | undefined;
  if (event.key === "ArrowDown") next = options[Math.min(index + 1, options.length - 1)];
  else if (event.key === "ArrowUp") next = options[Math.max(index - 1, 0)];
  else if (event.key === "Home") next = options[0];
  else if (event.key === "End") next = options[options.length - 1];
  else if (index >= 0 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    const toggle = focused.parentElement?.querySelector<HTMLButtonElement>('button[aria-expanded]');
    if (toggle?.getAttribute("aria-expanded") === String(event.key === "ArrowLeft")) toggle.click();
    event.preventDefault();
    return;
  }
  if (next) {
    event.preventDefault();
    next.focus();
  }
}
