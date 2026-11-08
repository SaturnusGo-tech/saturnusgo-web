"use client";

import { Button, Input } from "@heroui/react";
import { ProductDocTooltip } from "../overlay/ProductDocTooltip";
import { Check, LoaderCircle, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import repository from "../../../folders/presentation/structure/structure.module.css";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import shared from "../product-docs.module.css";
import styles from "./structure.module.css";

export function RenameFolder({ api, scope, copy, node, onSaved, onClose }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  copy: ProductDocsCopy;
  node: ProductDocNode;
  onSaved(): void;
  onClose(): void;
}) {
  const [title, setTitle] = useState(node.title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const name = title.trim();
    if (!name || name === node.title || pending.current) return;
    pending.current = true;
    setSaving(true);
    setError("");
    try {
      const current = await api.get(scope, node.id, { draft: true });
      if (!current.canEdit || current.kind !== "folder" || current.title !== node.title) {
        setError(copy.staleDraft);
        return;
      }
      await api.save(scope, node.id, {
        title: name, sections: current.sections, expectedDraftVersion: current.draftVersion,
      });
      onSaved();
      onClose();
    } catch {
      setError(copy.saveError);
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }

  return <form className={styles.rename} aria-label={copy.renameFolder} onSubmit={(event) => void save(event)} onKeyDown={(event) => {
    if (event.key === "Escape" && !pending.current) { event.stopPropagation(); onClose(); }
  }}>
    <Input classNames={{ base: styles.renameInput, inputWrapper: styles.renameInputWrapper, input: styles.renameField }}
      aria-label={copy.name} value={title} maxLength={200} isDisabled={saving} data-input-shell
      autoFocus onFocus={(event) => event.currentTarget.select()} onValueChange={setTitle} />
    <ProductDocTooltip label={copy.saveName}><Button size="sm" isIconOnly type="submit" className={repository.add} aria-label={copy.saveName}
      isDisabled={saving || !title.trim() || title.trim() === node.title}>
      {saving ? <LoaderCircle size={15} className={shared.loadingIcon} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
    </Button></ProductDocTooltip>
    <ProductDocTooltip label={copy.cancel}><Button size="sm" isIconOnly type="button" className={repository.add} aria-label={copy.cancel} isDisabled={saving} onPress={onClose}>
      <X size={15} aria-hidden="true" />
    </Button></ProductDocTooltip>
    {error && <p className={repository.error} role="alert">{error}</p>}
  </form>;
}
