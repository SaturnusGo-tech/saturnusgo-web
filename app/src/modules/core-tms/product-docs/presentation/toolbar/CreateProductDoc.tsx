"use client";

import { FileText, Folder, Plus } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";

export function CreateProductDoc({ api, scope, parentId, copy, onCreated }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  parentId: string | null;
  copy: ProductDocsCopy;
  onCreated(id: string, kind: ProductDocNode["kind"]): void;
}) {
  const [choosing, setChoosing] = useState(false);
  const [kind, setKind] = useState<ProductDocNode["kind"]>();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const operation = useRef<{ title: string; key: string } | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  function dismiss() {
    setChoosing(false);
    setKind(undefined);
    setTitle("");
    setFailed(false);
    operation.current = null;
    toggle.current?.focus();
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!kind || !title.trim() || saving) return;
    const name = title.trim();
    if (operation.current?.title !== name) operation.current = { title: name, key: crypto.randomUUID() };
    setSaving(true);
    setFailed(false);
    try {
      const result = await api.create(scope, { kind, parentId, title: name }, { idempotencyKey: operation.current.key });
      dismiss();
      onCreated(result.id, kind);
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return <div className={styles.toolbarControl} onKeyDown={(event) => {
    if (event.key !== "Escape" || (!kind && !choosing) || saving) return;
    event.preventDefault();
    dismiss();
  }}>
    <button ref={toggle} type="button" className={styles.primary} aria-expanded={choosing || Boolean(kind)}
      disabled={saving} onClick={() => kind || choosing ? dismiss() : setChoosing(true)}>
      <Plus size={15} aria-hidden="true" /> {copy.new}
    </button>
    {choosing && !kind && <div className={styles.toolbarPopover}>
      <button type="button" className={styles.menuItem} onClick={() => setKind("page")}><FileText size={16} aria-hidden="true" /> {copy.newPage}</button>
      <button type="button" className={styles.menuItem} onClick={() => setKind("folder")}><Folder size={16} aria-hidden="true" /> {copy.newFolder}</button>
    </div>}
    {kind && <form className={styles.toolbarPopover} onSubmit={create}>
      <label>{kind === "page" ? copy.newPage : copy.newFolder}
        <input autoFocus className={styles.textInput} type="text" aria-label={copy.name} value={title}
          disabled={saving} maxLength={200} onChange={(event) => setTitle(event.target.value)} />
      </label>
      {failed && <p className={styles.error} role="alert">{copy.saveError}</p>}
      <div className={styles.formActions}>
        <button className={styles.action} type="button" disabled={saving} onClick={dismiss}>{copy.cancel}</button>
        <button className={styles.primary} type="submit" disabled={saving || !title.trim()}>{saving ? copy.saving : copy.new}</button>
      </div>
    </form>}
  </div>;
}
