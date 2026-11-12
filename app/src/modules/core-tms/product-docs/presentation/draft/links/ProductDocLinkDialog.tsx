"use client";
import { AnchoredPopover as Popover } from "../../../../../../shared/components/anchored-popup/popover/AnchoredPopover";
import { AnchoredFreeSoloPopover as FreeSoloPopover } from "../../../../../../shared/components/anchored-popup/free-solo/AnchoredFreeSoloPopover";

import { Button, Input, PopoverContent } from "@heroui/react";
import { $isLinkNode } from "@lexical/link";
import { useReducedMotion } from "framer-motion";
import {
  activeEditor$, editorRootElementRef$, linkDialogState$, openLinkEditDialog$, readOnly$,
  removeLink$, switchFromPreviewToLinkEdit$, updateLink$, type EditLinkDialog,
} from "@mdxeditor/editor";
import { Cell, useCellValues, useRealm } from "@mdxeditor/gurx";
import { $getNodeByKey, $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { Link2 } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TmsLocale } from "../../../../localization/model/locale";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { useProductDocLinkPreview } from "../../../state/links/useProductDocLinkPreview";
import fields from "../../fields/product-doc-field.module.css";
import { productDocFieldSlots } from "../../fields/productDocFieldSlots";
import { ProductDocToolbarButton } from "../toolbar/menu/ProductDocToolbarMenu";
import { ProductDocSelectedLinkPreview } from "./selected/ProductDocSelectedLinkPreview";
import { ProductDocEditorLinkHover } from "./smart/ProductDocEditorLinkHover";
import styles from "./link-dialog.module.css";

const toolbarLinkAnchor$ = Cell<HTMLButtonElement | null>(null);

export function isProductDocLink(value: string) {
  return /^(?:https?:\/\/[^\s]+|mailto:[^\s]+|#[^\s]*|\/(?![\/\\])[^\s]*)$/i.test(value.trim());
}

export function ProductDocLinkTrigger({ locale, restoreSelection }: {
  locale: TmsLocale;
  restoreSelection?: () => boolean;
}) {
  const realm = useRealm();
  const button = useRef<HTMLButtonElement>(null);
  const [editor, readOnly, state, anchor] = useCellValues(activeEditor$, readOnly$, linkDialogState$, toolbarLinkAnchor$);
  const open = state.type === "edit" && Boolean(anchor && anchor === button.current);
  return <ProductDocToolbarButton ref={button} isIconOnly label={locale === "ru" ? "Добавить ссылку" : "Create link"} aria-expanded={open}
    aria-haspopup="dialog" isDisabled={readOnly} onPointerDown={(event) => event.preventDefault()}
    onClick={(event) => {
      if (open) {
        realm.pubIn({ [linkDialogState$]: { type: "inactive" }, [toolbarLinkAnchor$]: null });
        event.currentTarget.focus({ preventScroll: true });
        return;
      }
      if (!editor?.isEditable()) return;
      if (restoreSelection) {
        if (!restoreSelection()) return;
      } else if (!editor.getEditorState().read($getSelection)) {
        editor.update(() => $getRoot().selectEnd(), { discrete: true });
      }
      realm.pub(toolbarLinkAnchor$, event.currentTarget);
      realm.pub(openLinkEditDialog$, undefined);
    }}><Link2 size={16} aria-hidden="true" /></ProductDocToolbarButton>;
}

export function ProductDocLinkDialog() {
  const realm = useRealm();
  const { locale } = useTmsLocale();
  const reducedMotion = useReducedMotion();
  const ru = locale === "ru";
  const [state, toolbarAnchor, editor, popup, readOnly] = useCellValues(
    linkDialogState$, toolbarLinkAnchor$, activeEditor$, editorRootElementRef$, readOnly$,
  );
  const selection = useRef<HTMLSpanElement>(null!);
  const returnFocus = useRef<HTMLElement | null>(null);
  const activeToolbar = state.type === "edit" && toolbarAnchor?.isConnected ? toolbarAnchor : null;
  const open = state.type !== "inactive" && Boolean(popup?.current) && !readOnly;
  function close() {
    realm.pubIn({ [linkDialogState$]: { type: "inactive" }, [toolbarLinkAnchor$]: null });
  }
  function restoreFocus() {
    const target = returnFocus.current;
    returnFocus.current = null;
    // HeroUI retains its focus scope until the popover has exited.
    if (target) requestAnimationFrame(() => requestAnimationFrame(() => {
      if (target.isConnected) target.focus({ preventScroll: true });
    }));
  }
  function closeAndFocus(target: HTMLElement | null | undefined) {
    returnFocus.current = target ?? null;
    close();
    if (reducedMotion) restoreFocus();
  }

  const anchor = useMemo(() => ({
    get current() {
      if (activeToolbar) return activeToolbar;
      if (state.type === "inactive") return selection.current;
      return editor?.getElementByKey(state.decoratorNodeKey ?? state.linkNodeKey) ?? selection.current;
    },
  }), [activeToolbar, editor, state]);

  function cancel() {
    closeAndFocus(activeToolbar && !activeToolbar.closest("[inert]") ? activeToolbar : editor?.getRootElement());
  }

  const label = state.type === "preview" ? (ru ? "Ссылка" : "Link")
    : state.type === "edit" && state.initialUrl ? (ru ? "Редактировать ссылку" : "Edit link")
      : (ru ? "Добавить ссылку" : "Add link");
  const rectangle = state.type === "inactive" ? undefined : state.rectangle;
  const overlay = {
    onOpenChange: (next: boolean) => { if (!next) close(); }, triggerRef: anchor,
    portalContainer: popup?.current ?? undefined, placement: "bottom-start" as const, offset: 6, containerPadding: 10,
    shouldBlockScroll: false, shouldCloseOnScroll: false, disableAnimation: Boolean(reducedMotion),
    updatePositionDeps: [state.type], style: { zIndex: 160 },
  };
  return <>
    <ProductDocEditorLinkHover blocked={state.type !== "inactive"} />
    <Popover {...overlay} isOpen={open && state.type === "edit"} classNames={{ content: styles.panel }}
      motionProps={{ onAnimationComplete: (phase) => { if (phase === "exit") restoreFocus(); } }}>
      <span ref={selection} aria-hidden="true" className={styles.selectionAnchor}
        style={rectangle && { left: rectangle.left, top: rectangle.top, width: rectangle.width, height: rectangle.height }} />
      <PopoverContent aria-label={label} data-editor-dialog onKeyDownCapture={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
      }}>
        {state.type === "edit" && <LinkEditor key={state.linkNodeKey} state={state} ru={ru} label={label}
          onCancel={cancel} onSave={(values) => {
            realm.pub(updateLink$, values);
            editor?.update(() => {
              const range = $getSelection();
              if (!$isRangeSelection(range)) return;
              const node = range.focus.getNode();
              const link = $isLinkNode(node) ? node : node.getParent();
              if ($isLinkNode(link)) link.selectNext(0, 0);
            }, { discrete: true });
            closeAndFocus(editor?.getRootElement());
          }} />}
      </PopoverContent>
    </Popover>
    {open && state.type === "preview" && <FreeSoloPopover {...overlay} isOpen disableDialogFocus shouldCloseOnBlur={false}
      dialogProps={{ "aria-label": label }} classNames={{ content: `${styles.panel} ${styles.previewPanel}` }} data-editor-dialog>
      <ProductDocSelectedLinkPreview key={state.url} href={isProductDocLink(state.url) ? state.url : undefined} url={state.url} ru={ru}
        authoredText={editor?.getEditorState().read(() => {
          const node = $getNodeByKey(state.linkNodeKey);
          return $isLinkNode(node) && node.getURL() === state.url ? node.getTextContent() : undefined;
        })}
        onEdit={() => realm.pub(switchFromPreviewToLinkEdit$, undefined)}
        onRemove={() => {
          realm.pub(removeLink$, undefined);
          close();
          editor?.focus();
        }} />
    </FreeSoloPopover>}
  </>;
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
  const [address, setAddress] = useState(state.url);
  const { preview } = useProductDocLinkPreview(isProductDocLink(address) ? address : undefined);
  useLayoutEffect(() => {
    input.current?.focus({ preventScroll: true });
    input.current?.select();
  }, []);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const url = String(values.get("url") ?? "").trim();
    if (!isProductDocLink(url)) {
      setError(true);
      input.current?.focus({ preventScroll: true });
      return;
    }
    onSave({ url, title: String(values.get("title") ?? ""), text: String(values.get("text") ?? "").trim() || preview?.title || "" });
  }}>
    <strong className={styles.heading}>{label}</strong>
    <div className={fields.host} data-input-shell>
      <Input ref={input} name="url" label={ru ? "Адрес ссылки" : "Link URL"} labelPlacement="outside-top"
        classNames={productDocFieldSlots} defaultValue={state.url} placeholder="https://example.com"
        inputMode="url" autoComplete="off" spellCheck="false" isInvalid={error} validationBehavior="aria"
        errorMessage={error ? <span role="alert">{ru ? "Введите корректный адрес ссылки." : "Enter a valid link URL."}</span> : undefined}
        onBlur={(event) => setAddress(event.target.value)} onValueChange={() => { if (error) setError(false); }} />
    </div>
    {state.withAnchorText && <div className={fields.host} data-input-shell>
      <Input name="text" label={ru ? "Текст ссылки" : "Display text"} labelPlacement="outside-top"
        classNames={productDocFieldSlots} defaultValue={state.text} placeholder={preview?.title || undefined} />
    </div>}
    <div className={fields.host} data-input-shell>
      <Input name="title" label={ru ? "Подсказка (необязательно)" : "Link title (optional)"} labelPlacement="outside-top"
        classNames={productDocFieldSlots} defaultValue={state.title} />
    </div>
    <div className={styles.actions}>
      <Button type="button" onPress={onCancel}>{ru ? "Отмена" : "Cancel"}</Button>
      <Button type="submit">{ru ? "Сохранить" : "Save"}</Button>
    </div>
  </form>;
}
