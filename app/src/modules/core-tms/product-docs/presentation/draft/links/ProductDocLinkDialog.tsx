"use client";

import {
  activeEditor$, ButtonWithTooltip, editorRootElementRef$, linkDialogState$, openLinkEditDialog$, readOnly$,
  removeLink$, switchFromPreviewToLinkEdit$, updateLink$, type EditLinkDialog,
} from "@mdxeditor/editor";
import { Cell, useCellValues, useRealm } from "@mdxeditor/gurx";
import { $getRoot, $getSelection } from "lexical";
import { Check, Copy, ExternalLink, Link2, Pencil, Unlink } from "lucide-react";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { writeClipboardText } from "../../../../../../shared/lib/clipboard";
import type { TmsLocale } from "../../../../localization/model/locale";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useAnchoredPopup } from "../../../../presentation/common/popup/useAnchoredPopup";
import styles from "./link-dialog.module.css";

const toolbarLinkAnchor$ = Cell<HTMLButtonElement | null>(null);

export function isProductDocLink(value: string) {
  return /^(?:https?:\/\/[^\s]+|mailto:[^\s]+|#[^\s]*|\/(?![\/\\])[^\s]*)$/i.test(value.trim());
}

export function ProductDocLinkTrigger({ locale }: { locale: TmsLocale }) {
  const realm = useRealm();
  const [editor, readOnly, state, anchor] = useCellValues(activeEditor$, readOnly$, linkDialogState$, toolbarLinkAnchor$);
  const open = state.type === "edit" && Boolean(anchor);
  return <ButtonWithTooltip title={locale === "ru" ? "Добавить ссылку" : "Create link"} aria-expanded={open}
    aria-haspopup="dialog" disabled={readOnly} onPointerDown={(event) => event.preventDefault()}
    onClick={(event) => {
      if (open) {
        realm.pubIn({ [linkDialogState$]: { type: "inactive" }, [toolbarLinkAnchor$]: null });
        event.currentTarget.focus({ preventScroll: true });
        return;
      }
      if (!editor?.isEditable()) return;
      if (!editor.getEditorState().read($getSelection)) {
        editor.update(() => $getRoot().selectEnd(), { discrete: true });
      }
      realm.pub(toolbarLinkAnchor$, event.currentTarget);
      realm.pub(openLinkEditDialog$, undefined);
    }}><Link2 size={16} aria-hidden="true" /></ButtonWithTooltip>;
}

export function ProductDocLinkDialog() {
  const realm = useRealm();
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const [state, toolbarAnchor, editor, popup, readOnly] = useCellValues(
    linkDialogState$, toolbarLinkAnchor$, activeEditor$, editorRootElementRef$, readOnly$,
  );
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const activeToolbar = state.type === "edit" && toolbarAnchor?.isConnected ? toolbarAnchor : null;
  const open = state.type !== "inactive" && Boolean(popup?.current) && !readOnly;
  const close = useCallback(() => {
    realm.pubIn({ [linkDialogState$]: { type: "inactive" }, [toolbarLinkAnchor$]: null });
  }, [realm]);

  const anchor = useMemo(() => ({
    current: activeToolbar ?? (state.type === "inactive" ? null : {
      contains: () => false,
      getBoundingClientRect: () => {
        const inline = editor?.getElementByKey(state.decoratorNodeKey ?? state.linkNodeKey);
        if (inline) return inline.getBoundingClientRect();
        const { left, top, width, height } = state.rectangle;
        return new DOMRect(left, top, width, height);
      },
    }),
  }), [activeToolbar, editor, state]);
  useAnchoredPopup(open, false, root, anchor, panel, close, state.type === "preview" ? 278 : 336);
  useLayoutEffect(() => {
    if (!open || state.type !== "edit") return;
    const input = panel.current?.querySelector<HTMLInputElement>('[name="url"]');
    input?.focus({ preventScroll: true });
    input?.select();
  }, [open, state.type]);

  function cancel() {
    close();
    if (activeToolbar) activeToolbar.focus({ preventScroll: true });
    else editor?.focus();
  }

  if (!open || !popup?.current) return <></>;
  const label = state.type === "preview" ? (ru ? "Ссылка" : "Link")
    : state.initialUrl ? (ru ? "Редактировать ссылку" : "Edit link") : (ru ? "Добавить ссылку" : "Add link");
  return createPortal(<div ref={root}>
    <div ref={panel} role="dialog" aria-label={label} className={styles.panel} data-mode={state.type} popover="manual"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)
          && !activeToolbar?.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }}>
      {state.type === "edit" ? <LinkEditor key={state.linkNodeKey} state={state} ru={ru} label={label}
        onCancel={cancel} onSave={(values) => {
          realm.pub(updateLink$, values);
          close();
          editor?.focus();
        }} /> : <LinkPreview key={state.url} url={state.url} ru={ru}
        onEdit={() => realm.pub(switchFromPreviewToLinkEdit$, undefined)}
        onRemove={() => {
          realm.pub(removeLink$, undefined);
          close();
          editor?.focus();
        }} />}
    </div>
  </div>, popup.current);
}

function LinkEditor({ state, ru, label, onCancel, onSave }: {
  state: EditLinkDialog;
  ru: boolean;
  label: string;
  onCancel(): void;
  onSave(values: { url: string; title: string; text: string }): void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const url = String(values.get("url") ?? "").trim();
    if (!isProductDocLink(url)) {
      setError(true);
      input.current?.focus({ preventScroll: true });
      return;
    }
    onSave({ url, title: String(values.get("title") ?? ""), text: String(values.get("text") ?? "") });
  }}>
    <strong className={styles.heading}>{label}</strong>
    <label className={styles.field}>{ru ? "Адрес ссылки" : "Link URL"}
      <input ref={input} name="url" defaultValue={state.url} placeholder="https://example.com"
        inputMode="url" autoComplete="off" spellCheck={false} aria-invalid={error || undefined}
        onChange={() => { if (error) setError(false); }} />
    </label>
    {error && <p className={styles.error} role="alert">{ru ? "Введите корректный адрес ссылки." : "Enter a valid link URL."}</p>}
    {state.withAnchorText && <label className={styles.field}>{ru ? "Текст ссылки" : "Display text"}
      <input name="text" defaultValue={state.text} />
    </label>}
    <label className={styles.field}>{ru ? "Подсказка (необязательно)" : "Link title (optional)"}
      <input name="title" defaultValue={state.title} />
    </label>
    <div className={styles.actions}>
      <button type="button" onClick={onCancel}>{ru ? "Отмена" : "Cancel"}</button>
      <button type="submit">{ru ? "Сохранить" : "Save"}</button>
    </div>
  </form>;
}

function LinkPreview({ url, ru, onEdit, onRemove }: {
  url: string; ru: boolean; onEdit(): void; onRemove(): void;
}) {
  const [status, setStatus] = useState<"copied" | "failed">();
  const external = /^https?:\/\//i.test(url);
  const copyLabel = status === "copied" ? (ru ? "Ссылка скопирована" : "Link copied")
    : status === "failed" ? (ru ? "Не удалось скопировать ссылку" : "Couldn't copy link")
      : (ru ? "Скопировать ссылку" : "Copy link");
  return <div className={styles.preview}>
    <a href={isProductDocLink(url) ? url : undefined} target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined} title={url}>
      <span>{url}</span>{external && <ExternalLink size={13} aria-hidden="true" />}
    </a>
    <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={onEdit}
      aria-label={ru ? "Редактировать ссылку" : "Edit link"} title={ru ? "Редактировать ссылку" : "Edit link"}>
      <Pencil size={15} aria-hidden="true" />
    </button>
    <button type="button" aria-label={copyLabel} title={copyLabel}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => { void writeClipboardText(url).then(() => setStatus("copied"), () => setStatus("failed")); }}>
      {status === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
    </button>
    <button type="button" onPointerDown={(event) => event.preventDefault()} onClick={onRemove}
      aria-label={ru ? "Удалить ссылку" : "Remove link"} title={ru ? "Удалить ссылку" : "Remove link"}>
      <Unlink size={15} aria-hidden="true" />
    </button>
  </div>;
}
