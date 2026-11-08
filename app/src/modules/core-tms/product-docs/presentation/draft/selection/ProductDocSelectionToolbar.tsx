"use client";

import {
  activeEditor$, addComposerChild$, editorRootElementRef$, readOnly$, realmPlugin, useCellValue,
} from "@mdxeditor/editor";
import { $copyBlockFormatIndent, $patchStyleText, $setBlocksType } from "@lexical/selection";
import {
  $getNodeByKey, $getSelection, $getState, $isElementNode, $isRangeSelection, $isTextNode,
  $setSelection, $setState, SKIP_SCROLL_INTO_VIEW_TAG,
  type PointType, type RangeSelection, type TextFormatType,
} from "lexical";
import { $isHeadingNode } from "@lexical/rich-text";
import { Baseline, Bold, Italic, Strikethrough, Type, Underline } from "lucide-react";
import { useRef } from "react";
import { createPortal } from "react-dom";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import { ProductDocHighlightPicker } from "../highlight/ProductDocHighlightPicker";
import { ProductDocLinkTrigger } from "../links/ProductDocLinkDialog";
import { ProductDocToolbarButton, ProductDocToolbarMenu } from "../toolbar/menu/ProductDocToolbarMenu";
import { highlightStyleProperty } from "../../../../presentation/cases/inspector/markdown/highlight/model/highlightColors";
import { productDocTextColors, productDocTextStyles } from "../formatting/ProductDocFormattingTools";
import { productDocToneColor } from "../formatting/productDocFormatting";
import { literalHeadingState, sectionIdState } from "../sections/nodes/sectionNodeState";
import { useProductDocSelectionToolbar } from "./useProductDocSelectionToolbar";
import styles from "./selection-toolbar.module.css";

function pointIsValid(point: PointType) {
  const node = $getNodeByKey(point.key);
  return point.type === "text"
    ? $isTextNode(node) && point.offset <= node.getTextContentSize()
    : $isElementNode(node) && point.offset <= node.getChildrenSize();
}

function ProductDocSelectionToolbar() {
  const editor = useCellValue(activeEditor$);
  const popup = useCellValue(editorRootElementRef$);
  const readOnly = useCellValue(readOnly$);
  const { locale } = useTmsLocale();
  const ru = locale === "ru";
  const bubble = useRef<HTMLDivElement>(null);
  const { saved, placement } = useProductDocSelectionToolbar(readOnly ? null : editor, bubble);
  const visible = Boolean(placement?.visible && !readOnly);

  function apply(change?: (selection: RangeSelection) => void) {
    const selection = saved.current?.clone();
    if (!editor || readOnly || !selection) return false;
    const root = editor.getRootElement();
    if (root && root.ownerDocument.activeElement !== root) root.focus({ preventScroll: true });
    let restored = false;
    editor.update(() => {
      if (!pointIsValid(selection.anchor) || !pointIsValid(selection.focus)) return;
      $setSelection(selection);
      change?.(selection);
      const updated = $getSelection();
      saved.current = $isRangeSelection(updated) ? updated.clone() : null;
      restored = true;
    }, { discrete: true, tag: SKIP_SCROLL_INTO_VIEW_TAG });
    return restored;
  }

  const inlineTools = [
    ["bold", ru ? "Жирный" : "Bold", Bold],
    ["italic", ru ? "Курсив" : "Italic", Italic],
    ["underline", ru ? "Подчёркнутый" : "Underline", Underline],
    ["strikethrough", ru ? "Зачёркнутый" : "Strikethrough", Strikethrough],
  ] as const satisfies readonly [TextFormatType, string, typeof Bold][];
  const styleLabel = ru ? "Стиль текста" : "Text style";
  const colorLabel = ru ? "Цвет текста" : "Text color";

  if (!popup?.current) return null;
  return createPortal(<div ref={bubble} className={styles.bubble}
    role="group" aria-label={ru ? "Формат выделенного текста" : "Selected text formatting"}
    aria-hidden={!visible} aria-keyshortcuts="Alt+F10" data-visible={visible} data-below={placement?.below || undefined}
    style={placement ? { left: placement.left, top: placement.top } : undefined}
    inert={!visible} onMouseDown={(event) => {
      if (!(event.target as HTMLElement).closest("[role=menu], [role=dialog]")) event.preventDefault();
    }}
    onKeyDown={(event) => {
      if (event.key !== "Escape" || event.defaultPrevented || (event.target as HTMLElement).closest("[role=menu], [role=dialog]")) return;
      event.preventDefault();
      editor?.focus();
    }}>
    <ProductDocToolbarMenu title={styleLabel} portalContainer={bubble.current ?? undefined}
      items={productDocTextStyles(locale)} onChoose={(value) => {
        const entry = productDocTextStyles(locale).find((style) => style.value === value);
        if (!entry) return;
        apply((selection) => $setBlocksType(selection, entry.create, (previous, next) => {
          $copyBlockFormatIndent(previous, next);
          if ($isHeadingNode(previous) && $isHeadingNode(next)) {
            $setState(next, sectionIdState, $getState(previous, sectionIdState));
            if (previous.getTag() === next.getTag()) $setState(next, literalHeadingState, $getState(previous, literalHeadingState));
          }
        }));
      }}><Type size={16} aria-hidden="true" /></ProductDocToolbarMenu>
    <div className={styles.divider} aria-hidden="true" />
    {inlineTools.map(([format, label, Icon]) => <ProductDocToolbarButton key={format} isIconOnly label={label}
      aria-pressed={saved.current?.hasFormat(format) ?? false} onPress={() => apply((selection) => selection.formatText(format))}>
      <Icon size={15} aria-hidden="true" />
    </ProductDocToolbarButton>)}
    <ProductDocHighlightPicker locale={locale} portalContainer={bubble.current ?? undefined}
      onChoose={(color) => apply((selection) => $patchStyleText(selection, { [highlightStyleProperty]: color }))} />
    <div className={styles.divider} aria-hidden="true" />
    <ProductDocToolbarMenu title={colorLabel} portalContainer={bubble.current ?? undefined}
      items={productDocTextColors(locale).map((entry) => ({ ...entry, content: <>
        <span className={styles.swatch} style={{ color: entry.value === "default" ? "var(--falcon-text)" : productDocToneColor(entry.value) }} aria-hidden="true" />
        {entry.label}
      </> }))}
      onChoose={(value) => apply((selection) => $patchStyleText(selection, { color: value === "default" ? null : productDocToneColor(value) }))}>
      <Baseline size={16} aria-hidden="true" />
    </ProductDocToolbarMenu>
    <ProductDocLinkTrigger locale={locale} restoreSelection={apply} />
  </div>, popup.current);
}

export const productDocSelectionToolbarPlugin = realmPlugin({
  init(realm) { realm.pub(addComposerChild$, ProductDocSelectionToolbar); },
});
