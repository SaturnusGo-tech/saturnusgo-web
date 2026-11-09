"use client";

import { LoadingOrb } from "../../../../../shared/components/loading/LoadingOrb";
import { addToast, Button, Input, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { Check, ListPlus, Plus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ProductDocNode, ProductDocsApi, ProductDocScope } from "../../domain/product-docs";
import type { ProductDocsCopy } from "../../localization/copy";
import styles from "../product-docs.module.css";
import creation from "./folder-creation.module.css";
import { ProductDocSubpageComposer, type ProductDocSubpageInput } from "./subdoc/ProductDocSubpageComposer";

export function CreateProductDoc({ api, scope, parentId, kind, copy, onCreated, onCreatePage, disabled, labelled = false, pageLabel = copy.new, inline = false, iconOnly = false, projectName }: {
  api: ProductDocsApi;
  scope: ProductDocScope;
  parentId: string | null;
  kind: ProductDocNode["kind"];
  copy: ProductDocsCopy;
  onCreated(id: string, kind: ProductDocNode["kind"]): void;
  onCreatePage?(create: () => void): void;
  disabled?: boolean;
  labelled?: boolean;
  pageLabel?: string;
  inline?: boolean;
  iconOnly?: boolean;
  projectName?: string;
}) {
  const [folderOpen, setFolderOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const operation = useRef<{ payload: string; key: string } | null>(null);
  const currentRequest = useRef<AbortController | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const formId = useId();

  useEffect(() => () => currentRequest.current?.abort(), []);

  function dismiss() {
    setFolderOpen(false);
    setTitle("");
    setFailed(false);
    operation.current = null;
    requestAnimationFrame(() => toggle.current?.focus({ preventScroll: true }));
  }

  async function create(details: ProductDocSubpageInput) {
    if (!details.title || currentRequest.current) return;
    const controller = new AbortController();
    currentRequest.current = controller;
    const input = { kind, parentId, ...details };
    const payload = JSON.stringify(input);
    if (operation.current?.payload !== payload) {
      operation.current = { payload, key: crypto.randomUUID() };
    }
    setSaving(true);
    setFailed(false);
    try {
      const result = await api.create(scope, input, {
        idempotencyKey: operation.current.key, signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      dismiss();
      onCreated(result.id, kind);
    } catch {
      if (controller.signal.aborted) return;
      if (kind === "page") addToast({ title: copy.createError, severity: "danger" });
      else setFailed(true);
    } finally {
      currentRequest.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }

  function createFolder(event: FormEvent) {
    event.preventDefault();
    void create({ title: title.trim() });
  }

  if (kind === "page") return <div className={styles.toolbarControl}>
    <Button ref={toggle} size="sm" radius="full" isIconOnly={iconOnly} aria-label={pageLabel}
      variant={inline ? "light" : undefined} disableRipple
      className={iconOnly ? styles.iconButton : inline ? creation.subdocAction : styles.primary}
      aria-expanded={inline ? folderOpen : undefined} aria-controls={inline && folderOpen ? formId : undefined}
      isDisabled={saving || disabled} onPress={() => {
        if (inline) { if (!folderOpen) setFolderOpen(true); return; }
        const createPage = () => { void create({ title: copy.untitledPage }); };
        if (onCreatePage) onCreatePage(createPage);
        else createPage();
      }}>
      {saving ? <LoadingOrb /> : <Plus size={15} aria-hidden="true" />}
      {!iconOnly && <span>{pageLabel}</span>}
    </Button>
    {inline && folderOpen && <ProductDocSubpageComposer id={formId} scope={scope} projectName={projectName} copy={copy}
      disabled={saving} onCancel={dismiss} onCreate={(details) => {
        const createPage = () => { void create(details); };
        if (onCreatePage) onCreatePage(createPage);
        else createPage();
      }} />}
  </div>;

  return <div className={styles.folderCreator}>
    <Popover isOpen={folderOpen} onOpenChange={(open) => {
      if (currentRequest.current) return;
      if (open) setFolderOpen(true); else dismiss();
    }} placement="bottom-start" shouldBlockScroll={false} shouldCloseOnScroll={false}
      classNames={{ base: creation.positioner, content: creation.panel }}>
      <PopoverTrigger>
        <Button ref={toggle} size="sm" isIconOnly={!labelled} variant="light"
          className={`${labelled ? styles.primary : styles.iconButton} ${styles.hoverLine}`} aria-label={copy.newFolder} isDisabled={saving}>
          <ListPlus size={16} aria-hidden="true" />{labelled && copy.newFolder}
        </Button>
      </PopoverTrigger>
      <PopoverContent aria-label={copy.newFolder}>
        <form className={creation.form} onSubmit={createFolder} data-input-shell>
          <Input autoFocus type="text" aria-label={copy.name} value={title} placeholder={copy.name} isDisabled={saving} maxLength={200}
            classNames={{ base: creation.input, inputWrapper: creation.inputWrapper, input: creation.inputElement }} onValueChange={setTitle} />
          <Button size="sm" isIconOnly type="submit" className={styles.iconButton} aria-label={copy.createFolder} isDisabled={saving || !title.trim()}>
            {saving ? <LoadingOrb /> : <Check size={16} aria-hidden="true" />}
          </Button>
          <Button size="sm" isIconOnly type="button" className={styles.iconButton} aria-label={copy.cancel} isDisabled={saving}
            onPress={dismiss}><X size={16} aria-hidden="true" /></Button>
          {failed && <p className={styles.error} role="alert">{copy.createError}</p>}
        </form>
      </PopoverContent>
    </Popover>
  </div>;
}
