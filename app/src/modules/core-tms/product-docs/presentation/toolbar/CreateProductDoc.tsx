"use client";

import { Check, ListPlus, LoaderCircle, Plus, X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import popup from "../../../presentation/common/popup/caseFieldPopup.module.css";
import { useAnchoredPopup } from "../../../presentation/common/popup/useAnchoredPopup";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";
import creation from "./folder-creation.module.css";

export function CreateProductDoc({ api, scope, parentId, kind, copy, onCreated, labelled = false }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  parentId: string | null;
  kind: ProductDocNode["kind"];
  copy: ProductDocsCopy;
  onCreated(id: string, kind: ProductDocNode["kind"]): void;
  labelled?: boolean;
}) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const operation = useRef<{ title: string; key: string } | null>(null);
  const currentRequest = useRef<AbortController | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const control = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const formId = useId();

  useEffect(() => () => currentRequest.current?.abort(), []);

  const closeFromOutside = useCallback(() => {
    if (!currentRequest.current) setFolderOpen(false);
  }, []);
  useAnchoredPopup(folderOpen, false, control, toggle, panel, closeFromOutside, 250, 155);
  useLayoutEffect(() => {
    if (folderOpen) input.current?.focus({ preventScroll: true });
  }, [folderOpen]);

  function dismiss() {
    setFolderOpen(false);
    setTitle("");
    setFailed(false);
    operation.current = null;
    toggle.current?.focus({ preventScroll: true });
  }

  async function create(name: string) {
    if (!name || currentRequest.current) return;
    const controller = new AbortController();
    currentRequest.current = controller;
    if (operation.current?.title !== name) {
      operation.current = { title: name, key: crypto.randomUUID() };
    }
    setSaving(true);
    setFailed(false);
    try {
      const result = await api.create(scope, { kind, parentId, title: name }, {
        idempotencyKey: operation.current.key, signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      dismiss();
      onCreated(result.id, kind);
    } catch {
      if (!controller.signal.aborted) setFailed(true);
    } finally {
      currentRequest.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  function createFolder(event: FormEvent) {
    event.preventDefault();
    void create(title.trim());
  }

  return <div ref={control} className={kind === "folder" ? styles.folderCreator : styles.toolbarControl} onKeyDown={(event) => {
    if (event.key !== "Escape" || !folderOpen || saving) return;
    event.preventDefault();
    event.stopPropagation();
    dismiss();
  }}>
    {kind === "page" ? <button type="button" className={`${styles.primary} ${styles.createPage} ${styles.hoverLine}`}
      disabled={saving} onClick={() => void create(copy.untitledPage)}>
      {saving ? <LoaderCircle className={styles.loadingIcon} size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
      <span>{copy.new}</span>
    </button> : <button ref={toggle} type="button" className={`${labelled ? styles.primary : styles.iconButton} ${styles.hoverLine}`}
      aria-label={copy.newFolder} title={copy.newFolder} aria-haspopup="dialog"
      aria-expanded={folderOpen} aria-controls={folderOpen ? formId : undefined} disabled={saving}
      onClick={() => folderOpen ? dismiss() : setFolderOpen(true)}>
      <ListPlus size={16} aria-hidden="true" />
      {labelled && copy.newFolder}
    </button>}
    {kind === "page" && failed && <div className={styles.toolbarPopover} role="alert">{copy.createError}</div>}
    {kind === "folder" && <div ref={panel} className={`${creation.panel} ${popup.panel}`} id={formId}
      popover="manual" role="dialog" aria-label={copy.newFolder} data-open={folderOpen}
      aria-hidden={!folderOpen} inert={!folderOpen}>
      <form className={creation.form} onSubmit={createFolder}>
        <input ref={input} className={`${styles.textInput} ${creation.input}`} type="text" aria-label={copy.name} value={title}
          placeholder={copy.name} disabled={saving} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
        <button className={styles.iconButton} type="submit" aria-label={copy.createFolder} title={copy.createFolder}
          disabled={saving || !title.trim()}>
          {saving ? <LoaderCircle className={styles.loadingIcon} size={15} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
        </button>
        <button className={styles.iconButton} type="button" aria-label={copy.cancel} title={copy.cancel} disabled={saving}
          onClick={dismiss}><X size={16} aria-hidden="true" /></button>
        {failed && <p className={styles.error} role="alert">{copy.createError}</p>}
      </form>
    </div>}
  </div>;
}
